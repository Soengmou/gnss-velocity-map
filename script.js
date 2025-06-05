const map = L.map('map').setView([40, 75], 4);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let velocityLayer;

fetch('data/velocity.geojson')
  .then(res => res.json())
  .then(data => {
    velocityLayer = L.geoJSON(data, {
      pointToLayer: (feature, latlng) => {
        const vx = feature.properties.vx;
        const vy = feature.properties.vy;
        const magnitude = Math.sqrt(vx * vx + vy * vy);
        const angle = Math.atan2(vy, vx) * (180 / Math.PI);
        const arrow = L.divIcon({
          className: 'arrow-icon',
          html: `<div style="transform: rotate(${angle}deg);">&#8593;</div>`,
          iconSize: [20, 20]
        });
        return L.marker(latlng, { icon: arrow });
      }
    }).addTo(map);
  });

const drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

const drawControl = new L.Control.Draw({
  edit: { featureGroup: drawnItems },
  draw: {
    polygon: true,
    rectangle: true,
    circle: true,
    marker: false,
    polyline: false
  }
});
map.addControl(drawControl);

map.on(L.Draw.Event.CREATED, function (e) {
  const layer = e.layer;
  drawnItems.addLayer(layer);

  const geojson = layer.toGeoJSON();
  const selectedPoints = [];

  velocityLayer.eachLayer(pointLayer => {
    const pt = pointLayer.toGeoJSON();
    const isInside = turf.booleanPointInPolygon(pt, geojson);
    if (isInside) selectedPoints.push(pt);
  });

  const vx = selectedPoints.map(pt => pt.properties.vx);
  const vy = selectedPoints.map(pt => pt.properties.vy);

  Plotly.newPlot('chart', [{
    x: vx,
    y: vy,
    mode: 'markers',
    type: 'scatter'
  }], {
    title: 'Selected Velocity Vectors',
    xaxis: { title: 'Vx (mm/yr)' },
    yaxis: { title: 'Vy (mm/yr)' }
  });
});
