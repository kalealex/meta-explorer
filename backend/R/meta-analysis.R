runMetaAnalysis <- function(jsonData) {

library(tidyverse)
library(metafor)
library(jsonlite)

# Read in data from json.
data <- fromJSON(jsonData)

# Pre-processing
data <- data %>%
  mutate(
    # effectSize = if_else(author == "Counts" | author == "Proportions",
    #                      logOddsRatio,
    #                      SMD),
    # stdErrEffectSize = if_else(author == "Counts" | author == "Proportions",
    #                            stdErrLogOddsRatio,
    #                            stdErrSMD),
    # standardizedMetric = if_else(author == "Counts" | author == "Proportions",
    #                              "logOddsRatio",
    #                              "SMD"),
    study_id = as.factor(paste(author, " ", year)),
    yi = effectSize,                  
    vi = stdErrEffectSize^2,
    outcome = as.factor(standardizedMetric)
  )

# Build up model specification based on data provided and constraints:
# Base model specification as a string.
spec = "rma.mv(yi, vi" # start with simple fixed effects model
# Include moderators if provided based on data format. 
# if ("outcome" %in% colnames(data) && nlevels(data$outcome) >= 2) {
#   spec <- paste(spec, ",", "mods = ~ outcome") # add fixed effects for different measurements
# } else {
#   spec <- paste(spec, ",", "mods = ~") # start moderator formula expression
# }
# for (col in colnames(data)) {
#   if (str_detect(col, "group") & substr(spec, nchar(spec), nchar(spec)) == "~") {
#     spec <- paste(spec, "", col) # first grouping factor
#   } else if (str_detect(col, "group")) {
#     spec <- paste(spec, "+", col) # add grouping factors to model common sources of bias
#   }
# }
# We need more than two levels of factor to learn random effects variance parameters.
if (("study_id" %in% colnames(data) & nlevels(data$study_id) > 2) & ("outcome" %in% colnames(data) & nlevels(data$outcome) > 2)) {
    spec <- paste(spec, ",", "random = list(~ 1 | study_id, ~ 1 | outcome)") # add random effects per study and outcome measure
} else if ("study_id" %in% colnames(data) & nlevels(data$study_id) > 2 & ("outcome" %in% colnames(data) & nlevels(data$outcome) <= 2)) {
    spec <- paste(spec, ",", "random = ~ 1 | study_id") # add random effects per study
} else if ("study_id" %in% colnames(data) & nlevels(data$study_id) <= 2 & ("outcome" %in% colnames(data) & nlevels(data$outcome) > 2)) {
  spec <- paste(spec, ",", "random = ~ 1 | outcome") # add random effects per outcome, and not per study
}
spec <- paste(spec, ",", "data = data)") # add data and close parenthesis

# Run the model.
model <- eval(parse(text = spec))

# Postprocessing model output:
# Get overall effect size estimate and heterogeniety stats
# Adding moderators to model spec changes output of predict so that there is one prediction per study. This will require a change in postprocessing.
summary <- data_frame(
  "author" = "Overall",
  "summary" = TRUE,
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
  "standardizedMetric" = if_else(all(data$standardizedMetric == "SMD" | data$standardizedMetric == "arcsineRiskDiff"),
                                 "SMD",
                                 "logRiskRatio") # logOddsRatio or logRiskRatio
)
# Get study weights.
data <- data %>%
  mutate(weight = weights.rma.mv(model))
# Join summary with study data.
data <- data %>% full_join(summary, by = c("author", "effectSize", "stdErrEffectSize", "standardizedMetric"))
# Drop columns used only for modeling.
data <- data[ , !(names(data) %in% c("study_id", "yi", "vi", "outcome"))]

return(list(message = "finished", data = toJSON(data)))
}