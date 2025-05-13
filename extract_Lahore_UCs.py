import geopandas as gpd
gdf = gpd.read_file("C:/Users/HF/Downloads/adminbdy-shapefile/Adminbdy Shapefile/Union_Council.shp")

print(gdf.columns)
print(gdf.head())

lahore_ucs = gdf[gdf['DISTRICT'].str.lower() == 'lahore']
lahore_ucs.to_file("lahore_ucs.geojson", driver="GeoJSON")
