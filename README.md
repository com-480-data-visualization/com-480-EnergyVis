# Project of Data Visualization (COM-480)

| Student's name | SCIPER |
| -------------- | ------ |
| Simin Fan | 353791|
| Matteo Pagliardini | 235905 |
| Shuo Wen | 307251 |

[Milestone 1](#milestone-1) • [Milestone 2](#milestone-2) • [Milestone 3](#milestone-3)

## Milestone 1 (21st March, 5pm)

**10% of the final grade**


### Dataset

**Data Source.** This data analysis project focuses on the [Global Power Plant Database](https://datasets.wri.org/datasets/global-power-plant-database), a comprehensive, open-source inventory of power plants around the world. Compiled by the World Resources Institute (WRI) and various international collaborators, this database provides detailed information on power-generating facilities, including their geographic location, operational status, generation capacity, fuel type, and ownership structure. The database was built entirely from open sources, which are publicly available on the internet, including data from national government agencies, reports from companies that build power plants or provide their components, data from public utilities, and information from multinational organizations. The World Resources Institute is a global research non-profit organization which studies sustainable practices for business, economics, finance and governance.

**Description of the data.** The dataset contains information on more than 34000 power plants around the world. For each power plant, the database provides:
- Geographical information: its location and country.
- Electricity production information: its fuel type(s) and capacity.
- Information about the plant: its owner, year of commission, etc.

### Problematic
**Motivation.** The global energy landscape is undergoing a significant transformation as countries worldwide grapple with the challenge of meeting increasing energy demands while transitioning to more sustainable power sources. Understanding the current distribution, capacity, and characteristics of power generation facilities is crucial for policymakers, researchers, and industry stakeholders to make informed decisions about future energy investments and policies.

**Problem Statement.** Our analysis aims to explore the following features related to global power plant and energy distribution by visualization:

1. **Geographic Distribution and Energy Mix Disparities**: How does the distribution of power plants and their generation capacities vary across regions and countries? 
2. **Renewable and Green Energy Assessment**:  To what extent does each country adopt renewable/green energy resources instead of traditional fossil fuel-based ones?
3. **Ownership and Market Analysis**: What is the ownership structure of energy power plants across various countries and regions (e.g. public, private or mixed). It could impact the future policy and decommission schedules and global carbon emissions.
4. **Predictive Modelling for Energy Transitions**: As a stretch goal, we can develop predictive models to forecast the future power plant distribution and landscapes based on historical data.


### Exploratory Data Analysis

**Data preprocessing.** The datasets are in tabular format. Each row contains information on one individual power plant. During the preprocessing, we first remove the columns with a lot of missing values or unrelated to our problems or interests. Then, we add some attributes to the data. To visualize the continent-related distribution, we add the continent information based on the country names. Also, we divide the energy into renewable and non-renewable energy and add one attribute for this. Specifically, we consider Solar, Wind, Hydro, Geothermal, and Biomass as renewable energy and the others as non-renewable energy. We can also consider a different dichotomy: low CO2 vs high CO2 emissions.  

**Data analysis.** Basic statistical analysis can be found in **`[preprocess.ipynb](https://github.com/com-480-data-visualization/com-480-EnergyVis/blob/main/preprocess.ipynb)`**. In that notebook, we display the distribution of fuel types around the world, as well as per continent. We also plot the portion of solar energy in the total energy mix for each country. We analyze the distribution of commissioning years as well as the distribution of power plant owners. The basic statistical analysis shows that the dataset provides many opportunities to analyze the energy mix of different countries.

### Related work

What has already been done: On the official website, the WRI shows a map with the location and capacity of all the power plants around the world. It can be a nice reference to see the distribution of various types of energy resources. However, with a fixed plot, they do not visualize the evolution of the energy mix w.r.t. time and countries. Through analyzing the evolution of the composition of global energy power plants, we hope to uncover insightful findings about the energy transition and shed light on future energy structures. 

## Milestone 2 (18th April, 5pm)

**10% of the final grade**


## Milestone 3 (30th May, 5pm)

**80% of the final grade**


## Late policy

- < 24h: 80% of the grade for the milestone
- < 48h: 70% of the grade for the milestone

