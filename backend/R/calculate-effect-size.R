calculateEffectSize <- function(jsonData) {

library(tidyverse)
library(jsonlite)

# Read in data that users extract for each study. 
data <- fromJSON(jsonData)
# data <- read_json("testFromExtraction.json", simplifyVector = TRUE)

# Force R to handle all numerical data as doubles to prevent type errors.
data <- data %>% mutate_if(is.integer, as.numeric) %>% mutate_if(~all(is.na(.)), as.numeric)
  
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

# Fill in dataframe with the summary statistics we need for meta-analysis.
# Handle cases differently depending on outcomeType and how information was reported:

# Sample size is relevant to all types of outcomes.
# Add columns if we need to.
data <- data %>% add_col_if_not_exist(N, nExp, nCtrl)
# Do we have separate sample sizes for our two groups, or do we need to assume a balanced design?
data <- data %>% 
  mutate(
    N = case_when(
      is.na(N) & !is.na(nExp) & !is.na(nCtrl) ~ as.numeric(nExp + nCtrl), # calculate overall sample size
      TRUE                                    ~ as.numeric(N)),
    nExp = case_when(
      is.na(nExp) & !is.na(nCtrl) & !is.na(N) ~ as.numeric(N - nCtrl), # calculate treatment group sample size
      is.na(nExp) & is.na(nCtrl) & !is.na(N)  ~ as.numeric(floor(N / 2)), # assume a balanced design
      TRUE                                    ~ as.numeric(nExp)),
    nCtrl = case_when(
      is.na(nCtrl) & !is.na(nExp) & !is.na(N) ~ as.numeric(N - nExp), # calculate control group sample size
      is.na(nCtrl) & is.na(nExp) & !is.na(N)  ~ as.numeric(floor(N / 2)), # assume a balanced design
      TRUE                                    ~ as.numeric(nCtrl))
  )

if (any(data[["outcomeType"]] == "continuous")) {
  # For continuous outcomes...
  # Add columns if we need to.
  data <- data %>% add_col_if_not_exist(meanDiff, meanExp, meanCtrl, tValue, pValue, nTails, fValue, stdErrMeanDiff, lowerBoundCI, upperBoundCI, confLevelCI, sdDiff, sdExp, sdCtrl, r, SMD, stdErrSMD, pbCor, stdErrPbCor)
  
  # Calculate untransformed mean difference if we don't already have it.
  data <- data %>% 
    mutate(
      meanDiff = case_when(
        is.na(meanDiff) & !is.na(meanExp) & !is.na(meanCtrl) ~ meanExp - meanCtrl,
        TRUE                                                 ~ as.numeric(meanDiff))
    )
  
  # Calculate the standard error and pooled standard deviation with whatever information was extracted.
  data <- data %>%
    mutate(
      tValue = case_when(
        is.na(tValue) & !is.na(pValue) & !is.na(nTails) ~ qt(p = pValue / nTails, df = N - 2),
        is.na(tValue) & !is.na(fValue)                  ~ sqrt(fValue),
        TRUE                                            ~ as.numeric(tValue)),
      stdErrMeanDiff = case_when( # cases where we calculate stdErrMeanDiff from test statistics, etc.
        is.na(stdErrMeanDiff) & !is.na(lowerBoundCI) & !is.na(upperBoundCI) & !is.na(confLevelCI) ~ 0.5 * (upperBoundCI - lowerBoundCI) / abs(qt(p = (confLevelCI + (100 - confLevelCI) / 2) / 100, df = N - 2)),
        is.na(stdErrMeanDiff) & !is.na(meanDiff) & !is.na(tValue)                                 ~ abs(meanDiff / tValue),
        TRUE                                                                                      ~ as.numeric(stdErrMeanDiff)),
      sdDiff = case_when(
        is.na(sdDiff) & !is.na(sdExp) & !is.na(sdCtrl) ~ sqrt(((nExp - 1) * sdExp^2 + (nCtrl - 1) * sdCtrl^2) / (N - 2)),
        is.na(sdDiff) & !is.na(stdErrMeanDiff)         ~ stdErrMeanDiff / sqrt(1 / nExp + 1 / nCtrl),
        TRUE                                           ~ as.numeric(sdDiff)),
      stdErrMeanDiff = case_when( # cases where we calculate stdErrMeanDiff from sdDiff and not the other way around
        is.na(stdErrMeanDiff) & !is.na(r) & !is.na(sdDiff) ~ sqrt(2 * sdDiff * (1 - r) / N), # accounting for correlation (r) across timepoints for within-subjects contrasts
        is.na(stdErrMeanDiff) & !is.na(sdDiff)             ~ sdDiff * sqrt(1 / nExp + 1 / nCtrl), 
        TRUE                                               ~ as.numeric(stdErrMeanDiff))
    )
  
  # Now, calculate standardized mean difference and point biserial correlation.
  data <- data %>%
    mutate(
      SMD = case_when(
        is.na(SMD) & !is.na(meanDiff) & !is.na(sdDiff) & !is.na(r) ~ meanDiff / sdDiff, # no correction for within-subjects measures (indicated by presence of r)
        is.na(SMD) & !is.na(meanDiff) & !is.na(sdDiff)             ~ meanDiff / sdDiff * (1 - 3 / (4 * (nExp + nCtrl) - 9)), # apply Hedges' correction
        TRUE                                                       ~ as.numeric(SMD)),
      stdErrSMD = case_when(
        is.na(stdErrSMD) & !is.na(SMD) & !is.na(r) ~ sqrt(2 * (1 - r) / N + SMD^2 / (2 * N)), # accounting for correlation (r) across timepoints for within-subjects contrasts
        is.na(stdErrSMD) & !is.na(SMD)             ~ sqrt((nExp + nCtrl) / (nExp * nCtrl) + SMD^2 / (2 * (nExp + nCtrl))),
        TRUE                                       ~ as.numeric(stdErrSMD)),
      pbCor = case_when(
        is.na(pbCor) & !is.na(SMD) ~ SMD / sqrt(1 / ((nExp / N) * (nCtrl / N)) + SMD^2),
        TRUE                       ~ as.numeric(pbCor)),
      stdErrPbCor = case_when(
        is.na(stdErrPbCor) & !is.na(pbCor) ~ sqrt((1 - pbCor^2)^2 * (N * pbCor^2 / (4 * nExp * nCtrl) + (2 - 3 * pbCor^2) / (2 * N))),
        TRUE                               ~ as.numeric(stdErrPbCor))
    )
} 

if (any(data[["outcomeType"]] == "dichotomous")) {
  # For dichotomous outcomes...
  # Add columns if we need to.
  data <- data %>% add_col_if_not_exist(pExp, countExp, pCtrl, countCtrl, riskDiff, stdErrRiskDiff, logRiskRatio, stdErrLogRiskRatio, logOddsRatio, stdErrLogOddsRatio, arcsineRiskDiff, stdErrArcsineRiskDiff)
  
  # Calculate proportions and counts.
  data <- data %>%
    mutate(
      pExp = case_when(
        is.na(pExp) & !is.na(countExp) ~ countExp / nExp,
        TRUE                           ~ as.numeric(pExp)),
      pCtrl = case_when(
        is.na(pCtrl) & !is.na(countCtrl) ~ countCtrl / nCtrl,
        TRUE                             ~ as.numeric(pCtrl)),
      countExp = case_when(
        is.na(countExp) & !is.na(pExp) ~ floor(pExp * nExp),
        TRUE                           ~ as.numeric(countExp)),
      countCtrl = case_when(
        is.na(countCtrl) & !is.na(pCtrl) ~ floor(pCtrl * nCtrl),
        TRUE                             ~ as.numeric(countCtrl))
    )
    
  # Calculate untransformed risk difference and stdErrRiskDiff (default original units).
  data <- data %>%
    mutate(
      riskDiff = case_when(
        is.na(riskDiff) & !is.na(pExp) & !is.na(pCtrl) ~ pExp - pCtrl,
        TRUE                                           ~ as.numeric(riskDiff)),
      stdErrRiskDiff = case_when(
        is.na(stdErrRiskDiff) & !is.na(pExp) & !is.na(pCtrl) ~ sqrt(pExp * (1 - pExp) / nExp + pCtrl * (1 - pCtrl) / nCtrl),
        TRUE                                                 ~ as.numeric(stdErrRiskDiff))
    )
  
  # Calculate standardized effect size as log risk ratio, log odds ratio, and arcsine risk difference
  data <- data %>%
    mutate(
      logRiskRatio = case_when(
        is.na(logRiskRatio) & !is.na(pExp) & !is.na(pCtrl) ~ log(pExp / pCtrl),
        TRUE                                               ~ as.numeric(logRiskRatio)),
      stdErrLogRiskRatio = case_when(
        is.na(stdErrLogRiskRatio) & !is.na(countExp) & !is.na(countCtrl) ~ sqrt((nExp - countExp) / (countExp * nExp) + (nCtrl - countCtrl) / (countCtrl * nCtrl)),
        TRUE                                                             ~ as.numeric(stdErrLogRiskRatio)),
      logOddsRatio = case_when(
        is.na(logOddsRatio) & !is.na(pExp) & !is.na(pCtrl) ~ log((pExp / (1 - pExp)) / (pCtrl / (1 - pCtrl))),
        TRUE                                               ~ as.numeric(logOddsRatio)),
      stdErrLogOddsRatio = case_when(
        is.na(stdErrLogOddsRatio) & !is.na(countExp) & !is.na(countCtrl) ~ sqrt(1 / countExp + 1 / countCtrl + 1 / (N - countExp) + 1 / (N - countCtrl)),
        TRUE                                                             ~ as.numeric(stdErrLogOddsRatio)),
      arcsineRiskDiff = case_when(
        is.na(arcsineRiskDiff) & !is.na(pExp) & !is.na(pCtrl) ~ asin(sqrt(pExp)) - asin(sqrt(pCtrl)),
        TRUE                                                  ~ as.numeric(arcsineRiskDiff)), 
      stdErrArcsineRiskDiff = case_when(
        is.na(stdErrArcsineRiskDiff) & !is.na(arcsineRiskDiff) ~ sqrt(1 / (4 * nExp) + 1 / (4 * nCtrl)),
        TRUE                                                   ~ as.numeric(stdErrArcsineRiskDiff))
  ) 
}

# if (any(data[["outcomeType"]] == "association")) {
#   # For outcomes measured as correlations
#   # Add columns if we need to.
#   data <- data %>% add_col_if_not_exist(pearsonCor, stdErrPearsonCor, pbCor, stdErrPbCor, zCor, stdErrZCor, SMD, stdErrSMD)
#   
#   # Calculate standardized effect size as Pearson correlation, point-biserial correlation, Fisher's Z transformed correlation, and approximate SMD
#   data <- data %>%
#     mutate(
#       # should already have pearsonCor 
#       stdErrPearsonCor = case_when(
#         is.na(stdErrPearsonCor) & !is.na(pearsonCor) ~ sqrt((1 - pearsonCor^2) / (N - 2)),
#         TRUE                                         ~ as.numeric(stdErrPearsonCor)),
#       # should already have pbCor 
#       stdErrPbCor = case_when(
#         is.na(stdErrPbCor) & !is.na(pbCor) ~ sqrt((1 - pbCor^2)^2 * (N * pbCor^2 / (4 * nExp * nCtrl) + (2 - 3 * pbCor^2) / (2 * N))),
#         TRUE                               ~ as.numeric(stdErrPbCor)),
#       zCor = case_when(
#         is.na(zCor) & !is.na(pearsonCor) ~ 1 / 2 * log((1 + pearsonCor) / (1 - pearsonCor)),
#         TRUE                             ~ as.numeric(zCor)),
#       stdErrZCor = case_when(
#         is.na(stdErrZCor) & !is.na(zCor) ~ sqrt(1 / (N - 3)),
#         TRUE                             ~ as.numeric(stdErrZCor)),
#       SMD = case_when(
#         is.na(SMD) & !is.na(pbCor) ~ pbCor / sqrt((nExp / N) * (nCtrl / N) * (1 - pbCor^2)),
#         TRUE                       ~ as.numeric(SMD)),
#       stdErrSMD = case_when(
#         is.na(stdErrSMD) & !is.na(SMD) ~ sqrt((nExp + nCtrl) / (nExp * nCtrl) + SMD^2 / (2 * (nExp + nCtrl))),
#         TRUE                           ~ as.numeric(stdErrSMD))
#     )
# }

# Drop columns with nothing in them.
data <- data[,colSums(is.na(data)) < nrow(data)]

return(list(message = "success", data = toJSON(data)))
}


# Input variations to test.
# continuous: 
# from sd per group
# from sd of difference (pooled standard deviation)
# from se of difference
# from p-value
# from t-value
# from f-value
# from confidence interval
# requires mean difference or group means
# requires sample size overall or per group
# requires repeated measures correlation for within-subjects
# dichotomous:
# from counts per group
# from proportions per group
# requires sample size overall or per group
# association:
# requires correlation coefficient (pearson or pb)
# requires sample size overall or per group