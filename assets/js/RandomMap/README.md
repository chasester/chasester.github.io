# Continental Map Generator

### Overview
The goal of this project is to create Random continental sized islands which can be used for various game usage. Each region should follow standard terrestrial biome model, (rainfal over temature). This also seeks to create strong coast lines, with interseting features. To create this type of terrian this project follow the following model outlined in this file.
#### Dicationary
* Site - a point which represents the point of influence (generally in the center of the cell)
* Vertex - a point which defineds the endpoints of edges of a cell. This may also be defined as corner.
* Edge - a line Segment which is defined by two vertexs which is the boarder between two cells
* Cell - a polygon shape that has one site a set of edges and a set of vertexs that define the polygon.
* Blue Noise - Noise generated randomly but filtered through a set of algorithm(s) to reach a defined result. (Gaussian Noise)
## Voronio
Starting with a voronio graph allowed for a variety of polygons of a varied size. Voronio is an assemelaton of edges, where each line sites evenly between 2 sites. Sites are randomly generated positions. This allows for a for some very sharp polygons ranging from 3 - 9 sides, where a vertex is defined by the overlap of 2 lines. Although this is a good start we have shapes that are way to sharp (the angle of the lines coming out of a vertex is either very high (70-120 degrees) or very low (0-20).

## Relaxation
A Common practice when working with voronio is to do a relaxation algorithm. Due to some of the variation and randomness of the site generation, it can create some undesired resaults, (sharp corners, short edges, disportionate cell size).
### Loyds Relaxation
In this case adding some random variation will give a mix of sharp and smooth angles, giving a more realistic look to our biome bounds. The algorthem will average all of the vertex locations and then move the site towards the center of these vertexs a d distance, randomly ignoring one edge, or ignoring this site completey. When the relaxation is done we will destroy all edges, and vertexs, redrawing the vorionio graph with the new site positions. This algorithm runs an x number of times, or until no site moves a significate amount (less than d).

### Petels Relaxation

Petels Relaxation algorithm was removed from the demo version. This algorithm does a similar thing as the above, but rather it averages the vertexs based on its nieghboring vertexs. This keeps edges from becoming to small due to the above alogrithm (this is very insignificate on average and was removed)
