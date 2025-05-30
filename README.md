# Project of Data Visualization (COM-480)

| Student's name     | SCIPER |
| ------------------ | ------ |
| Simin Fan          | 353791 |
| Matteo Pagliardini | 235905 |
| Shuo Wen           | 307251 |

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

**Data analysis.** Basic statistical analysis can be found in [`preprocess.ipynb`](https://github.com/com-480-data-visualization/com-480-EnergyVis/blob/main/preprocess.ipynb). In that notebook, we display the distribution of fuel types around the world, as well as per continent. We also plot the portion of solar energy in the total energy mix for each country. We analyze the distribution of commissioning years as well as the distribution of power plant owners. The basic statistical analysis shows that the dataset provides many opportunities to analyze the energy mix of different countries.

### Related work

What has already been done: On the official website, the WRI shows a map with the location and capacity of all the power plants around the world. It can be a nice reference to see the distribution of various types of energy resources. However, with a fixed plot, they do not visualize the evolution of the energy mix w.r.t. time and countries. Through analyzing the evolution of the composition of global energy power plants, we hope to uncover insightful findings about the energy transition and shed light on future energy structures.

## Milestone 2 (18th April, 5pm)

### Overview of Website Skeleton.

We present the initial website skeleton at: [energyvis.github.io](https://olivia-fsm.github.io/energyvis.github.io/).

Our website visualizes key aspects of global power plants and energy distribution through three main sections:

(1) The **Global Summary** section provides an overview of worldwide power plants along with summary statistics at the global level. (2) The **Plant Distribution** section allows users to explore the geographic spread of power plants and view detailed statistics by selecting specific countries. (3) Lastly, the **Power Growth** section incorporates time-based data to show how power generation and distribution have evolved over the years.

### Design of the website: We include initial sketches of all sections in [milestone2.pdf](https://github.com/com-480-data-visualization/com-480-EnergyVis/blob/main/milestone_2.pdf) .

#### Figure 1: GlobalSummary.

The sketch of Figure 1 shows the layout of the GlobalSummary section as follows. Users can choose which aspect to visualize on the world map, such as the ratio of green to traditional energy, total power generation, or overall capacity. In addition to the map-based distribution, summary statistics are displayed at the bottom for a comprehensive overview.

#### Figure 2: Plant Distribution.

The sketch of Figure 2 shows the layout of the Power Plant Distribution section. In this section, we draw one dot per power plant, the color indicating the type of fuel utilized by the plant, its size representing the power output. The user can click on countries. When this happens, a window pops up describing the power mix of that country, including the distribution of maximum power output per fuel type, and the percentage of green energy in the total mix. We consider green energy, all the energy derived from sources with low CO2 emissions, such as solar, wind, geothermal, hydro, and nuclear. We also consider a different dichotomy: renewable vs non-renewable, which groups together solar, wind, geothermal, hydro on one side, and nuclear, gas, coal on the other. Importantly, the information shown would only consider the max capacity of each plant and fuel type, and ignore the fluctuations due to natural conditions (solar production peaks during mid-day / wind requires appropriate meteorological conditions, etc.).

#### Figure 3.1: Country-wiseGrowth of Power Supply

Figure 3.1 shows the layout of the Growth of Power Supply from the user-specified countries. The user can click on a specific country on a global map, and a pop-up box will display the growth trend of the power supply from each energy source between the years 2013-2019.

#### Figure 3.2: Global Growth of Power Supply

Figure 3.2 shows the trend of global (world-wide) power supply growth between 2013-2019. The user can choose the specific energy source of interest by clicking on the box, and the line chart on the right will display the growth curve with a description of the specific energy source.

### Tools to be used:

We will use JavaScript to build a dynamic and interactive website that allows users to explore global power plant data.

To visualize geographic distributions of power plants in Figure 2 and Figure 3, we will use `Leaflet.js` to integrate interactive maps. To display the trends of power growth in Figure 3, we also use both `D3.js` and `Plotly.js` to create responsive charts and graphs that highlight trends across regions and energy types.To simplify the javascript logic, we plan to preprocess our data using python, and generate a json file that contains already all the relevant information to be processed. This allows us to avoid redundant computation on the client side. We plan to use the following structure for our code:

> `website/data/processed_data.json`

> `website/js/main.js`

> `website/style/main.css`

> `website/index.html`

`processed_data.json` contains the preprocessed data generated by the python script. main.js javascript logic, including all the event handling. `main.css` is defining the style of each element, relying on flexbox to elegantly adjust the size of elements. Finally, `index.html` is defining all the elements of the page, including the three tabs, maps, and side panels.

What to add: We plan to add the prediction of power growth in the future years to the “Power Growth” page. For predictive modeling, we will use PyTorch and a statistical time-series prediction model to forecast future distributions and energy transitions based on historical data, offering insights into the evolving global energy landscape.

## Milestone 3 (30th May, 5pm)

Website: [energyvis.github.io](https://olivia-fsm.github.io/energyvis.github.io/).

Process book: [Process_Book.pdf](https://github.com/com-480-data-visualization/com-480-EnergyVis/blob/main/Process_Book.pdf).

Screen cast: [Screen_Cast.mp4](https://github.com/com-480-data-visualization/com-480-EnergyVis/blob/main/Screen_Cast.mp4).
