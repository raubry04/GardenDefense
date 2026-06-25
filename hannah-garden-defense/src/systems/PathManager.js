export class PathManager {
  constructor(scene, mapData) {
    this.scene = scene;
    this.waypoints = mapData.waypoints || [];
    this.aerialPath = mapData.aerialPath || { start: { x: 0, y: 0 }, end: { x: 0, y: 0 } };
    this.gate = this.waypoints.length > 0
      ? this.waypoints[this.waypoints.length - 1]
      : { x: 0, y: 0 };

    this._segmentLengths = this._computeSegmentLengths();
    this._totalLength = this._segmentLengths.reduce((sum, l) => sum + l, 0);
  }

  getNextWaypoint(currentIndex) {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= this.waypoints.length) return null;
    return this.waypoints[nextIndex];
  }

  getProgress(currentIndex, positionAlongSegment = 0) {
    if (this._totalLength === 0) return 0;

    let distanceCovered = 0;
    for (let i = 0; i < currentIndex && i < this._segmentLengths.length; i++) {
      distanceCovered += this._segmentLengths[i];
    }

    if (currentIndex < this._segmentLengths.length) {
      distanceCovered += this._segmentLengths[currentIndex] * Phaser.Math.Clamp(positionAlongSegment, 0, 1);
    }

    return Phaser.Math.Clamp(distanceCovered / this._totalLength, 0, 1);
  }

  getAerialPosition(progress) {
    const t = Phaser.Math.Clamp(progress, 0, 1);
    return {
      x: Phaser.Math.Linear(this.aerialPath.start.x, this.aerialPath.end.x, t),
      y: Phaser.Math.Linear(this.aerialPath.start.y, this.aerialPath.end.y, t),
    };
  }

  _computeSegmentLengths() {
    const lengths = [];
    for (let i = 0; i < this.waypoints.length - 1; i++) {
      const a = this.waypoints[i];
      const b = this.waypoints[i + 1];
      lengths.push(Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y));
    }
    return lengths;
  }
}
