document.addEventListener('DOMContentLoaded', () => {

    // 1. General initialization
    // 1.1. Global State
    let processedData = null;
    let worldGeoJson = null;
    let maps = {
        summary: null,
        distribution: null,
        growth: null
    };
    let geoJsonLayers = {
        summary: null,
        distribution: null,
        growth: null
    };

    // 1.2. Document Object Model Elements
    const tabs = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const growthFuelSelect = document.getElementById('growth-fuel-select');

    // 1.3. Map Options
    const mapOptions = {
        center: [20, 0],
        zoom: 2,
        scrollWheelZoom: true
    };
    const tileLayerUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    const tileLayerOptions = {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    };

    // 1.4. Color & Size
    const fuelColors = {
        'Solar': '#f9d71c', 'Wind': '#add8e6', 'Hydro': '#4682b4', 'Gas': '#ffa500',
        'Coal': '#808080', 'Nuclear': '#ff69b4', 'Oil': '#a52a2a', 'Biomass': '#228b22',
        'Geothermal': '#dc143c', 'Unknown': '#d3d3d3'
    };
    const growthColorScale = { maxPositive: 1000, maxNegative: -500 };

    // 2. Functions to initialize the website
    // 2.1. Overall initial
    async function initialize() {
        const [processedResponse, geoJsonResponse] = await Promise.all([
            fetch('data/processed_data.json'),
            fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson')
        ]);

        processedData = await processedResponse.json();
        worldGeoJson = await geoJsonResponse.json();

        console.log("Processed data loaded:", processedData);
        console.log("GeoJSON loaded.");

        setupTabs();
        initAllMaps();

        // Use Summary as the default tab (the user will see this right after go into the website)
        initSummaryTab();
    }

    // 2.2. Initialize all the three tabs
    function setupTabs() {
         tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                const targetContentId = tab.id.replace('tab-', '') + '-content';
                document.getElementById(targetContentId).classList.add('active');

                switch (tab.id) {
                    case 'tab-summary':
                        initSummaryTab();
                        maps.summary?.invalidateSize();
                        break;
                    case 'tab-distribution':
                        initDistributionTab();
                        maps.distribution?.invalidateSize();
                        break;
                    case 'tab-growth':
                        initGrowthTab();
                        maps.growth?.invalidateSize();
                        break;
                }
            });
        });
    }

    // 2.3 Initialize the world maps
    function initAllMaps() {
        if (document.getElementById('map-summary') && !maps.summary) {
            maps.summary = L.map('map-summary', mapOptions);
            L.tileLayer(tileLayerUrl, tileLayerOptions).addTo(maps.summary);
            console.log("Summary map object CREATED:", maps.summary); // <-- ADD THIS LOG
        }
         if (document.getElementById('map-distribution') && !maps.distribution) {
            maps.distribution = L.map('map-distribution', mapOptions);
            L.tileLayer(tileLayerUrl, tileLayerOptions).addTo(maps.distribution);
        }
         if (document.getElementById('map-growth') && !maps.growth) {
            maps.growth = L.map('map-growth', mapOptions);
            L.tileLayer(tileLayerUrl, tileLayerOptions).addTo(maps.growth);
        }
    }

    // 3. For the tab 'Summary'
    // 3.1. Initialize the summary page
    function initSummaryTab() {
        console.log("Initializing Summary Tab");
        const latestYear = processedData.years[processedData.years.length - 1];
        const globalData = processedData.global_summary[latestYear];

        const statsContainer = document.getElementById('global-summary-stats');
         if (!statsContainer) return; // Exit if container not found
        statsContainer.innerHTML = `
            <h4>Global Stats (${latestYear})</h4>
            <p>Total Capacity: ${globalData?.total_capacity?.toLocaleString() || 0} MW</p>
            <div id="global-summary-chart"></div>
        `;

        // Summary Visualization
        const fuelData = Object.entries(globalData || {})
            .filter(([key]) => key !== 'total_capacity')
            .map(([fuel, capacity]) => ({ fuel, capacity }));

        const plotData = [{
            labels: fuelData.map(d => d.fuel), values: fuelData.map(d => d.capacity),
            type: 'pie', marker: { colors: fuelData.map(d => fuelColors[d.fuel] || fuelColors['Unknown']) },
            hole: .4, textinfo: 'percent', hoverinfo: 'label+value'
        }];

        const layout = {
            title: `Global Fuel Mix by Capacity (${latestYear})`, showlegend: true,
            margin: { l: 20, r: 20, t: 40, b: 20 }, height: 300
        };

        Plotly.newPlot('global-summary-chart', plotData, layout, {responsive: true});

        // Map Visualization: Color countries by Total Capacity
        if (geoJsonLayers.summary) maps.summary.removeLayer(geoJsonLayers.summary);

        geoJsonLayers.summary = L.geoJSON(worldGeoJson, {
            style: feature => {
                const countryName = getCountryNameFromFeature(feature);
                const countryData = processedData.country_summary[countryName]?.[latestYear];
                const capacity = countryData?.total_capacity || 0;

                let fillColor = '#d3d3d3';
                if (capacity > 1000) fillColor = '#bd0026';
                else if (capacity > 500) fillColor = '#f03b20';
                else if (capacity > 100) fillColor = '#fd8d3c';
                else if (capacity > 0) fillColor = '#fecc5c';
                return { fillColor: fillColor, weight: 1, opacity: 1, color: 'white', fillOpacity: 0.7 };
            },
            onEachFeature: (feature, layer) => {
                const countryName = getCountryNameFromFeature(feature);
                const countryData = processedData.country_summary[countryName]?.[latestYear];
                const capacity = countryData?.total_capacity || 0;
                layer.bindTooltip(`<b>${countryName}</b><br>Total Capacity: ${capacity.toLocaleString()} MW`);
            }
        }).addTo(maps.summary);
         maps.summary.invalidateSize();
    }

    // 4. For the tab 'Plant distribution'
    // 4.1. Initialize the plant distribution
    function initDistributionTab() {

        console.log("Initializing Distribution Tab");

        maps.distribution.eachLayer(layer => {
            if (!(layer instanceof L.TileLayer)) {
                maps.distribution.removeLayer(layer);
            }
        });
        geoJsonLayers.distribution = null;

        processedData.plants_latest.forEach(plant => {
            if (plant.lat != null && plant.lon != null) {
                L.circleMarker([plant.lat, plant.lon], {
                    radius: getPlantMarkerRadius(plant.cap),
                    fillColor: fuelColors[plant.fuel] || fuelColors['Unknown'],
                    color: "#000", weight: 0.5, opacity: 1, fillOpacity: 0.8
                }).addTo(maps.distribution)
                .bindTooltip(`<b>${plant.country || 'N/A'}</b><br>Fuel: ${plant.fuel || 'N/A'}<br>Capacity: ${plant.cap?.toLocaleString() || 'N/A'} MW`);
            }
        });

        geoJsonLayers.distribution = L.geoJSON(worldGeoJson, {
            style: { fillColor: 'transparent', weight: 0.5, opacity: 0.2, color: '#555' },
            onEachFeature: (feature, layer) => {
                layer.on('click', (e) => {
                    L.DomEvent.stopPropagation(e);
                    const countryName = getCountryNameFromFeature(feature);
                    console.log("Clicked on country:", countryName);
                    displayCountryDistributionInfo(countryName);
                });
            }
        }).addTo(maps.distribution);
         maps.distribution.invalidateSize();
    }

    // 4.2. Disply the plant distrubution and country distribution
    function displayCountryDistributionInfo(countryName) {

        const latestYear = processedData.years[processedData.years.length - 1];
        const countryData = processedData.country_summary[countryName]?.[latestYear];
    
        const panel = document.getElementById('country-info-distribution');
        const nameDiv = document.getElementById('dist-country-name');
        const chartsDiv = document.getElementById('dist-charts');
    
        console.log("Showing distribution panel for:", countryName);
        showPanel('country-info-distribution'); 

        chartsDiv.innerHTML = '<p style="color: black;">Coming soon...</p>';
    }

    // 5. For the tab 'Power growth'
    // 5.1. Initialize the Power growth tab
    function initGrowthTab() {
        if (!processedData || !worldGeoJson || !maps.growth) {
            console.log("Growth tab init skipped: data or map not ready.");
            return;
        }
        console.log("Initializing Growth Tab");
        updateGrowthMapColors();
        plotGlobalGrowthChart();
        maps.growth.invalidateSize();
   }

   // 5.2. Get the global growth chart on the bottom of the page
   function plotGlobalGrowthChart() {
        // (Keep the plotGlobalGrowthChart function exactly as it was)
        if (!processedData) return;
        const chartDiv = document.getElementById('global-growth-chart');
        if (!chartDiv) return;
        const globalDataByYear = processedData.global_summary; const years = processedData.years; const plotTraces = [];
        processedData.fuel_types.forEach(fuel => {
            const capacityValues = years.map(year => globalDataByYear[year]?.[fuel] || 0);
            if (capacityValues.some(v => v > 0)) { plotTraces.push({ x: years, y: capacityValues, mode: 'lines+markers', name: fuel, marker: { color: fuelColors[fuel] || fuelColors['Unknown'] }, line: { shape: 'spline' } }); }
        });
        const totalCapacityValues = years.map(year => globalDataByYear[year]?.total_capacity || 0);
        plotTraces.push({ x: years, y: totalCapacityValues, mode: 'lines+markers', name: 'Global Total', marker: { color: '#000000' }, line: { dash: 'dashdot', width: 3 } });
        const layout = { xaxis: { title: 'Year' }, yaxis: { title: 'Capacity (MW)' }, margin: { t: 20, b: 40, l: 60, r: 20 }, height: 300, hovermode: 'x unified' };
        Plotly.newPlot(chartDiv, plotTraces, layout, {responsive: true});
    }


   // 5.3. Update the color after selecting the countries
   function updateGrowthMapColors() {
       if (!processedData || !worldGeoJson || !maps.growth) return;
       const selectedFuel = growthFuelSelect.value;

       if (geoJsonLayers.growth) maps.growth.removeLayer(geoJsonLayers.growth);

       geoJsonLayers.growth = L.geoJSON(worldGeoJson, {
           style: feature => {
               const countryName = getCountryNameFromFeature(feature);
               const growthData = processedData.country_growth_delta[countryName];
               const delta = growthData ? (growthData[selectedFuel] ?? 0) : 0;
               return { fillColor: getGrowthColor(delta), weight: 1, opacity: 1, color: 'white', fillOpacity: 0.8 };
           },
           onEachFeature: (feature, layer) => {
               const countryName = getCountryNameFromFeature(feature);
               const growthData = processedData.country_growth_delta[countryName];
               const delta = growthData ? (growthData[selectedFuel] ?? 0) : 0;
               const deltaText = delta !== null ? `<span class="math-inline">\{delta \>\= 0 ? '\+' \: ''\}</span>{delta.toLocaleString()} MW` : 'N/A';
               const fuelName = selectedFuel === '_total' ? 'Total' : selectedFuel;
               layer.bindTooltip(`<b><span class="math-inline">\{countryName\}</b\><br\></span>{fuelName} Growth: ${deltaText}`);
               layer.on('click', (e) => {
                   L.DomEvent.stopPropagation(e);
                   displayCountryGrowthInfo(countryName);
               });
           }
       }).addTo(maps.growth);
   }

   // 5.4. Update the power growth information after selecting the countries
   function displayCountryGrowthInfo(countryName) {
       const panel = document.getElementById('country-info-growth');
       const nameDiv = document.getElementById('growth-country-name');
       const chartDiv = document.getElementById('country-growth-chart');
       if (!panel || !nameDiv || !chartDiv) return;
   
       nameDiv.textContent = `Power Growth Trend for ${countryName}`;
       chartDiv.innerHTML = '<p>Coming soon...</p>';
       showPanel('country-info-growth');
   }
   
    // 6. Utils
    // 6.1. Function to set the color
    function getGrowthColor(value) {
        // (Keep the getGrowthColor function exactly as it was)
        if (value > 0) {
            const intensity = Math.min(1, value / (growthColorScale.maxPositive || 1));
            const red = 255;
            const greenBlue = 255 * (1 - intensity);
            return `rgb(${red}, ${Math.round(greenBlue)}, ${Math.round(greenBlue)})`;
        } else if (value < 0) {
            const intensity = Math.min(1, Math.abs(value) / (Math.abs(growthColorScale.maxNegative) || 1));
            const blue = 255;
            const redGreen = 255 * (1 - intensity);
            return `rgb(${Math.round(redGreen)}, ${Math.round(redGreen)}, ${blue})`;
        } else {
            return '#ffffff';
        }
    }

    // 6.2. Function to draw the radius
    function getPlantMarkerRadius(capacity) {
        return Math.max(3, Math.sqrt(capacity / 10));
    }

    // 6.3. get contry name from feature
    function getCountryNameFromFeature(feature) {
        return feature.properties.ADMIN || feature.properties.name;
    }

    // 7. Panel Visibility
    window.showPanel = function(panelId) {
        const panel = document.getElementById(panelId); if (panel) panel.classList.remove('hidden');
    }
    window.hidePanel = function(panelId) {
        const panel = document.getElementById(panelId); if (panel) panel.classList.add('hidden');
    }

    // 8. Start the application
    initialize();

});