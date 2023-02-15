runSensitivityAnalysis <- function(jsonData) {

  library(tidyverse)
  library(metafor)
  library(jsonlite)
  
  # Read in data from json.
  data <- fromJSON(jsonData)
  # data <- output %>%
  #   mutate(
  #     effectSize = SMD,
  #     stdErrEffectSize = stdErrSMD,
  #     standardizedMetric = "SMD"
  #   )
  
  # Pre-processing
  data <- data %>%
    mutate(
      study_id = paste(author, " ", year),
      yi = effectSize,                  
      vi = stdErrEffectSize^2,
      outcome = as.factor(standardizedMetric)
    )
  
  # helper function to add empty columns to df if they don't already exists
  add_col_if_not_exist <- function(df, ...) {
    args <- ensyms(...)
    for (arg in args) {
      if (is.null(df[[toString(arg)]])) {
        df <- df %>% mutate(!!arg := NA)
      }
    }
    return(df)
  }
  
  # List out every possible combination of studies:
  # Define permutation function
  perm <- function(v) {
    n <- length(v)
    if (n == 1) v
    else {
      X <- NULL
      for (i in 1:n) X <- rbind(X, cbind(v[i], perm(v[-i])))
      X
    }
  }
  
  # Get unique studies.
  data <- data %>% 
    add_col_if_not_exist(group, timePoint) %>% 
    mutate(
      id = if_else(!is.na(group) & !is.na(timePoint),
                   paste(study_id, group, timePoint),
                   if_else(is.na(group) & !is.na(timePoint),
                           paste(study_id, timePoint),
                           if_else(!is.na(group) & is.na(timePoint),
                                   paste(study_id, group),
                                   study_id
                           )
                     
                   )
           )
    )
  studies <- unique(data$id)
  
  # Declare results data structure.
  results <- list()
  counter <- 0
  
  # Permutation to get subsets of each possible size.
  for (i in 1:length(studies)) { 
    if (i == 1) {
      subsets_of_size_i <- cbind(unique(perm(studies)[,1:i]))
    } else {
      subsets_of_size_i <- unique(t(apply(perm(studies)[,1:i], 1, sort)))
    }
    for (j in 1:length(subsets_of_size_i[,1])) {
      # Filter data to current subset (run each analysis)
      curr_data <- data %>% 
        filter(id %in% subsets_of_size_i[j,]) %>%
        mutate(id = as.factor(id))
      
      if (i > 1) {
        # Build up model specification based on data provided and constraints:
        # Base model specification as a string.
        spec = "rma.mv(yi, vi" # start with simple fixed effects model
        # Include moderators if provided based on data format. 
        # if ("outcome" %in% colnames(curr_data) && nlevels(curr_data$outcome) >= 2) {
        #   spec <- paste(spec, ",", "mods = ~ outcome") # add fixed effects for different measurements
        # } else {
        #   spec <- paste(spec, ",", "mods = ~") # start moderator formula expression
        # }
        # for (col in colnames(curr_data)) {
        #   if (str_detect(col, "group") & substr(spec, nchar(spec), nchar(spec)) == "~") {
        #     spec <- paste(spec, "", col) # first grouping factor
        #   } else if (str_detect(col, "group")) {
        #     spec <- paste(spec, "+", col) # add grouping factors to model common sources of bias
        #   }
        # }
        # We need more than two levels of factor (i.e., id) to learn random effects variance parameters.
        if ("id" %in% colnames(curr_data) & nlevels(curr_data$id) > 2) {
          spec <- paste(spec, ",", "random = ~ 1 | id") # add random effects per study
        }
        spec <- paste(spec, ",", "data = curr_data)") # add data and close parenthesis
        
        # Run the model.
        model <- eval(parse(text = spec))
        
        # Postprocessing model output:
        # Get overall effect size estimate and heterogeniety stats
        # Adding moderators to model spec changes output of predict so that there is one prediction per study. This will require a change in postprocessing.
        summary <- data_frame(
          "author" = "Overall",
          "plotID" = unique(curr_data$plotID),
          "summary" = TRUE,
          "study_set" = list(subsets_of_size_i[j,]),
          "effectSize" = predict.rma(model)$pred,
          "stdErrEffectSize" = predict.rma(model)$se,
          "tau2" = model$tau2,
          "stdErrTau2" = if_else(is.null(model[["se.tau2"]]),
                                 NA,
                                 model$se.tau2),
          "Q" = model$QE,
          "dfQ" = model$k - model$p
        ) %>% mutate(
          "pQ" = pchisq(Q, dfQ, lower.tail = FALSE),
          "I2" = if_else(is.null(model[["I2"]]),
                         (model$QE - (model$k - model$p)) / model$QE, # overall I^2 if no moderators
                         model$I2), # residual I^2 after grouping by moderators
          "standardizedMetric" = if_else(all(curr_data$standardizedMetric == "SMD" | curr_data$standardizedMetric == "arcsineRiskDiff"),
                                         "SMD",
                                         "logOddsRatio") # logOddsRatio or logRiskRatio
        )
        # Get study weights.
        curr_data <- curr_data %>%
          mutate(weight = weights.rma.mv(model))
      } else { # only one study
        # Run no model.
        
        # Carry forward effect size estimate from single study as result.
        summary <- tibble(
          "author" = "Overall",
          "plotID" = unique(curr_data$plotID),
          "summary" = TRUE,
          "study_set" = list(subsets_of_size_i[j,]),
          "effectSize" = curr_data$effectSize,
          "stdErrEffectSize" = curr_data$stdErrEffectSize,
          "tau2" = NA,
          "stdErrTau2" = NA,
          "Q" = NA,
          "dfQ" = NA,
          "pQ" = NA,
          "I2" = NA,
          "standardizedMetric" = if_else(all(curr_data$standardizedMetric == "SMD" | curr_data$standardizedMetric == "arcsineRiskDiff"),
                                         "SMD",
                                         "logOddsRatio") # logOddsRatio or logRiskRatio
        )
        # Get study weights.
        curr_data <- curr_data %>%
          mutate(weight = 100)
      }
      
      
      # Join summary with study data.
      curr_data <- curr_data %>% full_join(summary, by = c("author", "plotID", "effectSize", "stdErrEffectSize", "standardizedMetric"))
      # Drop columns used only for modeling.
      curr_data <- curr_data[ , !(names(curr_data) %in% c("yi", "vi", "outcome"))]
      
      # Collate results
      counter = counter + 1
      results[[counter]] <- curr_data
    }
  }
  
  return(list(message = "finished", data = toJSON(results)))
}