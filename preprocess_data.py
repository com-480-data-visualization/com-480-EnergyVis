# preprocess_data.py
import json
from collections import defaultdict
import math

# Define fuel categories
GREEN_FUELS = {"Solar", "Wind", "Hydro", "Nuclear", "Geothermal", "Biomass"}
RENEWABLE_FUELS = {"Solar", "Wind", "Hydro", "Geothermal", "Biomass"} # Excludes Nuclear

# --- Helper Functions ---
def calculate_country_stats(plants):
    """Calculates aggregated stats for a list of plants (typically one country, one year)."""
    stats = {
        'total_capacity': 0,
        'fuels': defaultdict(float),
        'green_capacity': 0,
        'renewable_capacity': 0,
    }
    for plant in plants:
        capacity = plant.get('capacity_mw', 0)
        fuel = plant.get('primary_fuel', 'Unknown')
        stats['total_capacity'] += capacity
        stats['fuels'][fuel] += capacity
        if fuel in GREEN_FUELS:
            stats['green_capacity'] += capacity
        if fuel in RENEWABLE_FUELS:
            stats['renewable_capacity'] += capacity

    # Convert defaultdict back to dict for JSON serialization
    stats['fuels'] = dict(stats['fuels'])

    # Calculate percentages
    if stats['total_capacity'] > 0:
        stats['green_perc'] = round((stats['green_capacity'] / stats['total_capacity']) * 100, 1)
        stats['renewable_perc'] = round((stats['renewable_capacity'] / stats['total_capacity']) * 100, 1)
    else:
        stats['green_perc'] = 0
        stats['renewable_perc'] = 0

    return stats

def get_growth(data_start, data_end):
    """Calculates capacity growth between two points."""
    if data_start is None or data_end is None:
        return 0 # Or None, depending on how you want to handle missing data
    return data_end - data_start


# --- Main Processing Logic ---
def preprocess_data(input_file='raw_data.json', output_file='website/data/processed_data.json'):
    """Loads raw data, processes it, and saves the structured output."""
    try:
        with open(input_file, 'r') as f:
            raw_data = json.load(f)
    except FileNotFoundError:
        print(f"Error: Input file '{input_file}' not found.")
        return
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from '{input_file}'.")
        return

    years = sorted(raw_data.keys())
    if not years:
        print("Error: No year data found in input file.")
        return
    latest_year = years[-1]
    start_year = years[0]

    processed_data = {
        'plants_latest': [], # For Plant Distribution map
        'country_summary': defaultdict(lambda: defaultdict(dict)), # {country: {year: {stats}}}
        'global_summary': defaultdict(lambda: defaultdict(float)), # {year: {fuel: capacity, total_capacity: X}}
        'country_growth_delta': defaultdict(lambda: defaultdict(float)), # {country: {fuel: delta_capacity}}
        'fuel_types': set(),
        'years': years
    }

    all_plants_by_year = defaultdict(list)
    plants_by_country_year = defaultdict(lambda: defaultdict(list))

    # Initial pass: Group plants and collect fuel types
    for year, plants in raw_data.items():
        for plant in plants:
            country = plant.get('country')
            fuel = plant.get('primary_fuel')
            if country and fuel:
                processed_data['fuel_types'].add(fuel)
                all_plants_by_year[year].append(plant)
                plants_by_country_year[country][year].append(plant)
                if year == latest_year:
                     # Keep only necessary fields for the map display
                    processed_data['plants_latest'].append({
                        "country": country,
                        "lat": plant.get("latitude"),
                        "lon": plant.get("longitude"),
                        "fuel": fuel,
                        "cap": plant.get("capacity_mw")
                    })

    # Calculate yearly summaries (global and per country)
    all_countries = plants_by_country_year.keys()
    for year in years:
        # Global stats for the year
        global_stats_this_year = calculate_country_stats(all_plants_by_year[year])
        processed_data['global_summary'][year]['total_capacity'] = global_stats_this_year['total_capacity']
        for fuel, capacity in global_stats_this_year['fuels'].items():
             processed_data['global_summary'][year][fuel] = capacity

        # Per-country stats for the year
        for country in all_countries:
             country_plants_this_year = plants_by_country_year[country].get(year, [])
             country_stats_this_year = calculate_country_stats(country_plants_this_year)
             processed_data['country_summary'][country][year] = country_stats_this_year


    # Calculate growth delta (start_year to latest_year) per country per fuel
    for country in all_countries:
        stats_start = processed_data['country_summary'][country].get(start_year, {}).get('fuels', {})
        stats_latest = processed_data['country_summary'][country].get(latest_year, {}).get('fuels', {})
        all_fuels_for_country = set(stats_start.keys()) | set(stats_latest.keys())

        total_cap_start = processed_data['country_summary'][country].get(start_year, {}).get('total_capacity', 0)
        total_cap_latest = processed_data['country_summary'][country].get(latest_year, {}).get('total_capacity', 0)
        processed_data['country_growth_delta'][country]['_total'] = get_growth(total_cap_start, total_cap_latest)


        for fuel in all_fuels_for_country:
             cap_start = stats_start.get(fuel, 0)
             cap_latest = stats_latest.get(fuel, 0)
             processed_data['country_growth_delta'][country][fuel] = get_growth(cap_start, cap_latest)

    # Convert defaultdicts to regular dicts and fuel_types set to list for JSON
    processed_data['country_summary'] = {c: dict(y_data) for c, y_data in processed_data['country_summary'].items()}
    processed_data['global_summary'] = dict(processed_data['global_summary'])
    processed_data['country_growth_delta'] = dict(processed_data['country_growth_delta'])
    processed_data['fuel_types'] = sorted(list(processed_data['fuel_types']))


    # Save the processed data
    try:
        # Ensure the output directory exists (create if necessary) - requires Python 3.2+
        import os
        output_dir = os.path.dirname(output_file)
        if output_dir and not os.path.exists(output_dir):
            os.makedirs(output_dir)

        with open(output_file, 'w') as f:
            json.dump(processed_data, f, indent=2) # Use indent for readability
        print(f"Successfully processed data and saved to '{output_file}'")
    except Exception as e:
        print(f"Error saving processed data to '{output_file}': {e}")


# --- Run the script ---
if __name__ == "__main__":
    preprocess_data()