# Data Description for Cleaned CSV Files

This directory contains cleaned data related to demographics, arrests, and incarceration across various California counties.

## `young_adult.csv`

Contains combined data on youth and adult arrests, differentiated by an `Age` column.

-   **Headers**: `Year`, `County`, `Gender`, `Race`, `Offense_Category`, `Count`, `Age`
-   **Data Types**: `Integer`, `String`, `String`, `String`, `String`, `Float`, `String`

## `jail.csv`

Contains data on jail populations, including sentencing status and average daily population (ADP).

-   **Headers**: `Index`, `County`, `Year`, `Sex`, `Sentencing status`, `Offense_Category`, `Jail_ADP`
-   **Data Types**: `Integer`, `String`, `Integer`, `String`, `String`, `String`, `Integer`

## `demographic.csv`

Contains youth demographic data (ages 10-17), including population counts and poverty rates.

-   **Headers**: `Year`, `County`, `Gender`, `Race`, `Population_age_10-17`, `Poverty_rate_age_12-17`
-   **Data Types**: `Integer`, `String`, `String`, `String`, `Integer`, `Float`

## `county_prison.csv`

Contains county-level data on the cost per prisoner, number of imprisonments, and general population figures. Note: The granularity of this file might correspond to combinations found in other files (like arrest categories) within the same Year/County, leading to repeated county-level metrics.

-   **Headers**: `Year`, `County`, `Cost_per_prisoner`, `Imprisonments`, `Population`
-   **Data Types**: `Integer`, `String`, `Float`, `Float`, `Float`
