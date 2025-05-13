import geopandas as gpd

# Replace with the path to your `.shp` file (not just the folder)
gdf = gpd.read_file("C:/Users/HF/Downloads/adminbdy-shapefile/Adminbdy Shapefile/Union_Council.shp")

# Print available columns to understand the structure
print(gdf.columns)
print(gdf.head())

# Replace column names as per actual output
print(gdf.columns)  # confirm columns again if needed

# Filter for Lahore district
lahore_ucs = gdf[gdf['DISTRICT'].str.lower() == 'lahore']

# Export filtered data to GeoJSON
lahore_ucs.to_file("lahore_ucs.geojson", driver="GeoJSON")
