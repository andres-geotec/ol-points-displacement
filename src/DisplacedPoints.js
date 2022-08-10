/**
 * @module DisplacedPoints
 */

import Feature from "ol/Feature";
import Point from "ol/geom/Point";

import methodsPlacement from "./methodsPlacement";
import Cluster from "./Cluster";
import CircleProperties from "./Circle";

/**
 * @typedef {Object} Options
 * @property {string} [methodPlacement=ring] methodPlacement
 * @property {number} [radioCenterPoint=6] radioCenterPoint
 * @property {number} [radioDisplacedPoints=6] radioDisplacedPoints
 */

/**
 * @classdesc
 * La metodología desplazamiento de puntos funciona para visualizar todas las
 * entidades de una capa de puntos, incluso si tienen la misma ubicación.
 *
 * Para hacer esto, el mapa toma los puntos que caen en una tolerancia de
 * Distancia dada entre sí (clúster) y los coloca alrededor de su baricentro.
 */
class DisplacedPoints extends Cluster {
  /**
   * @param {Options} options DisplacedPoints options.
   */
  constructor(options) {
    console.log("instancioansdo DisplacedPoints");
    super(options);

    /**
     * @type {string}
     * @private
     */
    this.methodPlacement = options.methodPlacement || "ring";

    /**
     * @type {number}
     * @protected
     */
    this.radioCenterPoint = options.radioCenterPoint || 6;

    /**
     * @type {number}
     * @protected
     */
    this.radioDisplacedPoints = options.radioDisplacedPoints || 6;

    /**
     * @type {Array<Feature>}
     * @protected
     */
    this.displacedFeatures = [];

    /**
     * @type {Array<Feature>}
     * @protected
     */
    this.displacedRings = [];

    /**
     * @type {Array<Feature>}
     * @protected
     */
    this.displacedConnectors = [];
  }

  /**
   * Remove all features from the source.
   * @param {boolean} [opt_fast] Skip dispatching of {@link module:ol/source/VectorEventType~VectorEventType#removefeature} events.
   * @api
   */
  clear(opt_fast) {
    this.features.length = 0;
    this.displacedFeatures = [];
    this.displacedRings = [];
    this.displacedConnectors = [];
    super.clear(opt_fast);
  }

  /**
   * Handle the source changing.
   */
  refresh() {
    this.clear();
    this.cluster();
    this.displacedPoints();
    this.addFeatures(this.allFeatures());
  }

  allFeatures() {
    return [
      ...this.displacedConnectors,
      ...this.displacedRings,
      ...this.features,
      ...this.displacedFeatures,
    ];
  }

  /**
   * @returns {Array<(import("ol/Feature").default)>} All the displaced points and rings
   * @protected
   */
  displacedPoints() {
    /*if (this.features.length) {
      const cluster = this.features[0];
      this.pointsGroup(cluster.get("geometry"), cluster.get("features"));
      return;
    }*/

    this.features.forEach((cluster) => {
      this.pointsGroup(cluster.get("geometry"), cluster.get("features"));
    });
  }

  /**
   * @param {import("ol/geom/Point").default} center Cluster centroid point
   * @param {Array<(import("ol/Feature").default)>} features Clustered features
   * @returns {Array<(import("ol/Feature").default)>} The displaced points and rings of the group
   * @protected
   */
  pointsGroup(center, features) {
    if (features.length === 1) return;

    /**
     * Teorema de Pitágoras
     * c² = √(b² + a²)
     * Math.SQRT2 = √(1² + 1²)
     * Math.SQRT2 = Math.pow(2, 1/2)
     */

    /**
     * Distancia entre el centroide del grupo y cualquiera de sus puntos deslazados si sus diametros
     * se tocaran
     * @type {number}
     */
    const distanceRadiusCenterAndDisplacedPoints =
      this.radioCenterPoint + this.radioDisplacedPoints;

    /**
     * Hipotenusa = Lado opuesto al ángulo recto en un triángulo rectángulo.
     * @type {number} √((radioCenterPoint + radioDisplacedPoints)² + (radioCenterPoint + radioDisplacedPoints)²)
     */
    const hypotenuseCenterAndPoints =
      distanceRadiusCenterAndDisplacedPoints * Math.SQRT2;

    /**
     * Hipotenusa = Lado opuesto al ángulo recto en un triángulo rectángulo.
     * @type {number} √(radioCenterPoint² + radioCenterPoint²) / 100
     */
    const hypotenuseCenter = this.radioCenterPoint * Math.SQRT2;

    ({
      ring: this.Ring,
    })[this.methodPlacement](
      center.getCoordinates(),
      hypotenuseCenterAndPoints,
      hypotenuseCenter,
      features
    );
  }

  /**
   *
   * @param {number} centerCords
   * @param {number} hypotenuseCenterAndPoints
   * @param {number} hypotenuseCenter
   * @param {Array<Feature>} features
   */
  Ring = (
    centerCords,
    hypotenuseCenterAndPoints,
    hypotenuseCenter,
    features
  ) => {
    const nFeatures = features.length;

    const minCircleToFitPoints = new CircleProperties({
      circumference: nFeatures * hypotenuseCenterAndPoints,
    });
    const maxDisplacementDistance = Math.max(
      hypotenuseCenterAndPoints / 2,
      minCircleToFitPoints.radius
    );
    const radiusOfTheRing = maxDisplacementDistance + hypotenuseCenter;

    this.addRing(centerCords, {
      radius: radiusOfTheRing,
    });

    const radiusOfTheRingPix = this.numberToPixelUnits(radiusOfTheRing);
    const angleStep = (2 * Math.PI) / nFeatures;
    var currentAngle = 0.0;

    features.forEach((feature) => {
      this.addDisplacedPoints(feature, [
        centerCords[0] + radiusOfTheRingPix * Math.sin(currentAngle),
        centerCords[1] + radiusOfTheRingPix * Math.cos(currentAngle),
      ]);

      currentAngle += angleStep;
    });
  };

  addRing(coordinates, options) {
    this.displacedRings.push(
      new Feature({
        geometry: new Point(coordinates),
        anillo: options,
      })
    );
  }

  addDisplacedPoints(feature, coordinates) {
    const newFeature = feature.clone();
    newFeature.setGeometry(new Point(coordinates));
    this.displacedFeatures.push(newFeature);
  }

  /**
   *
   * @param {number} number
   * @returns {number}
   */
  numberToPixelUnits(number) {
    return number * this.resolution;
  }

  /**
   *
   * @param {number} pixelUnits
   * @returns {number}
   */
  pixelUnitsToNumber(pixelUnits) {
    return pixelUnits / this.resolution;
  }
}

export default DisplacedPoints;