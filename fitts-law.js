"use strict";

// ... (makeDimension, plot dimensions, etc. - 이전과 동일)
function makeDimension(width, height, top, right, bottom, left) {
  return {
    width: width,
    height: height,
    innerWidth: width - (left + right),
    innerHeight: height - (top + bottom),
    top: top,
    right: right,
    bottom: bottom,
    left: left,
    cx: (width - (left + right)) / 2 + left,
    cy: (height - (top + bottom)) / 2 + top,
  };
}

var testDimension = makeDimension(620, 400, 30, 30, 30, 30);
var plotPositionDimension = makeDimension(220, 200, 30, 30, 30, 30);
var plotVelocitiesDimension = plotPositionDimension;
var plotHitsDimension = plotPositionDimension;
var plotScatterDimension = makeDimension(220, 200, 30, 30, 30, 50);
var scatterEffectiveDimension = makeDimension(540, 300, 30, 30, 30, 50);
var positionEffectiveDimension = makeDimension(540, 200, 30, 30, 30, 40);
var speedEffectiveDimension = positionEffectiveDimension;
var histDimension = makeDimension(540, 300, 30, 30, 30, 50);

var LIVE_STAY = 1000;
var UPDATE_DELAY = 2000;
var MAX_SPEED = 6; // pixel/ms

function rHit(r, rTarget) {
  return (plotHitsDimension.innerWidth / 2 / rTarget) * r;
}
function v(v) {
  var colour = "rgb(" + clampInt(0, 255, (v / MAX_SPEED) * 255) + ", 0, 0)";
  return colour;
}

var scatterX = d3.scale
  .linear()
  .domain([0.5, 5.5])
  .range([0, plotScatterDimension.innerWidth]);
var scatterY = d3.scale
  .linear()
  .domain([2000, 0]) // MAX_TIME 대신 고정값 사용
  .range([0, plotScatterDimension.innerHeight]);
var scaleT = d3.scale
  .linear()
  .domain([0, 1000])
  .range([0, plotVelocitiesDimension.innerWidth]);
var scaleV = d3.scale
  .linear()
  .domain([0, MAX_SPEED])
  .range([plotVelocitiesDimension.innerHeight, 0]);
var scaleX = d3.scale
  .linear()
  .domain([-20, 300])
  .range([0, plotPositionDimension.innerWidth]);
var scaleY = d3.scale
  .linear()
  .domain([-50, 50])
  .range([positionEffectiveDimension.innerHeight, 0]);
var effScatterX = d3.scale
  .linear()
  .domain([0.5, 6.5])
  .range([0, scatterEffectiveDimension.innerWidth]);
var effScatterY = d3.scale
  .linear()
  .domain([2000, 0]) // MAX_TIME 대신 고정값 사용
  .range([0, scatterEffectiveDimension.innerHeight]);
var effPositionX = d3.scale
  .linear()
  .domain([-60, 400])
  .range([0, positionEffectiveDimension.innerWidth]);
var effPositionY = d3.scale
  .linear()
  .domain([-50, 50])
  .range([positionEffectiveDimension.innerHeight, 0]);
var effSpeedX = d3.scale
  .linear()
  .domain([0, 2000]) // MAX_TIME 대신 고정값 사용
  .range([0, speedEffectiveDimension.innerWidth]);
var effSpeedY = d3.scale
  .linear()
  .domain([0, MAX_SPEED])
  .range([speedEffectiveDimension.innerHeight, 0]);

var fittsTest = {
  target: { x: 0, y: 0, r: 10 },
  start: { x: 0, y: 0, t: 0 },
  last: {},
  isoPositions: [],
  currentPosition: 0,
  currentCount: 0,
  miss: 0,
  isoLimits: { minD: 120, maxD: 300, minW: 10, maxW: 100 },
  isoParams: { num: 9, distance: 200, width: 50, randomize: true },
  currentPath: [],
  active: false,
  data: {},
  dataCnt: 0,
  roundData: [],
  roundColour: null,
  colour: d3.scale.category10(),
  updateTimeoutHandle: undefined,
  roundInProgress: false,
  conditions: [
    { id: 2.32, distance: 200, width: 50 },
    { id: 2.81, distance: 300, width: 50 },
    { id: 3.16, distance: 200, width: 25 },
    { id: 3.32, distance: 270, width: 30 },
    { id: 3.7, distance: 300, width: 25 },
    { id: 4.25, distance: 270, width: 15 },
  ],
  sessionOrder: [],
  currentConditionIndex: 0,
  trialsInCurrentBlock: 0, // 'successes'에서 'trials'로 이름 및 역할 변경

  startRound: function () {
    if (this.roundInProgress) return;
    this.roundInProgress = true;
    this.currentConditionIndex = 0;

    this.trialsInCurrentBlock = 0;
    this.roundData = [];
    this.roundColour = this.colour(this.dataCnt);

    this.sessionOrder = [...this.conditions];
    for (let i = this.sessionOrder.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.sessionOrder[i], this.sessionOrder[j]] = [
        this.sessionOrder[j],
        this.sessionOrder[i],
      ];
    }

    d3.select("#startButton").style("display", "none");
    d3.select(".sliders").style("display", "none");

    this.startNextBlock();
  },

  startNextBlock: function () {
    const currentCondition = this.sessionOrder[this.currentConditionIndex];

    this.isoParams.distance = currentCondition.distance;
    this.isoParams.width = currentCondition.width;
    this.trialsInCurrentBlock = 0; // 현재 블록 성공 횟수 초기화
    this.updateISOCircles();

    this.last = {
      x: testDimension.cx,
      y: testDimension.cy,
      t: new Date().getTime(),
    };
    this.start = this.last;
    this.currentPath = [this.start];

    this.generateTarget();
    this.updateProgressText();
  },

  /*updateProgressText: function () {
    const currentCondition = this.sessionOrder[this.currentConditionIndex];
    if (!currentCondition) return;

    const progressText = `ID: ${currentCondition.id.toFixed(2)}  |  시행: ${
      this.trialsInCurrentBlock
    } / 9  |  전체: ${this.currentConditionIndex + 1} / 6`;
    d3.select("#progressText").text(progressText);
  },*/

  endRound: function () {
    this.active = false;
    this.roundInProgress = false;

    this.updatePlots(this);

    if (this.roundData.length > 0) {
      this.createNewDataSet();
    }

    this.removeTarget();
    d3.select("#startButton").style("display", "block");
    d3.select(".sliders").style("display", "block");
    d3.select("#progressText").text("실험 준비");

    alert("실험 종료!");
  },
  createNewDataSet: function () {
    this.dataCnt++;
    const num = this.dataCnt;
    this.data[num] = {
      data: this.roundData,
      colour: this.colour(this.dataCnt),
    };

    // UI 다시 그리기 및 데이터 저장
    renderAllDataSetsUI();
    localStorage.setItem("fittsLawData", JSON.stringify(this.data));

    this.roundData = [];
  },

  deleteDataSet: function (num) {
    d3.select("#dataSet" + num).remove();
    delete this.data[num];

    // 데이터 삭제 후 저장 및 그래프 업데이트
    localStorage.setItem("fittsLawData", JSON.stringify(this.data));
    this.updatePlots(this);
  },

  generateTarget: function () {
    this.target = this.isoPositions[this.currentPosition];
    this.target.distance = this.isoParams.distance;
    this.currentPosition =
      (this.currentPosition + Math.ceil(this.isoPositions.length / 2)) %
      this.isoPositions.length;
    var target = testAreaSVG.selectAll("#target").data([this.target]);
    var insert = function (d) {
      d.attr("cx", function (d) {
        return d.x;
      })
        .attr("cy", function (d) {
          return d.y;
        })
        .attr("r", function (d) {
          return d.w / 2;
        });
    };
    target
      .enter()
      .append("circle")
      .attr("id", "target")
      .style("fill", "red")
      .call(insert);
    target.transition().call(insert);
    this.active = true;
  },

  updateISOCircles: function () {
    this.currentCount = 0;
    this.generateISOPositions(
      this.isoParams.num,
      this.isoParams.distance,
      this.isoParams.width
    );
    var circles = testAreaSVG.selectAll("circle.iso").data(this.isoPositions);
    var insert = function (d) {
      d.attr("cx", function (d) {
        return d.x;
      })
        .attr("cy", function (d) {
          return d.y;
        })
        .attr("r", function (d) {
          return d.w / 2;
        });
    };
    circles.enter().append("circle").attr("class", "iso").call(insert);
    circles.transition().call(insert);
    circles.exit().transition().attr("r", 0).remove();
    this.currentPosition = 0;
    this.active = false;
  },

  generateISOPositions: function (num, d, w) {
    plotHitsGroup
      .selectAll("circle.hit")
      .transition()
      .duration(LIVE_STAY)
      .ease("linear")
      .attr("r", 2)
      .style("opacity", 0)
      .remove();
    plotPositionGroup
      .selectAll("line.live")
      .transition()
      .duration(LIVE_STAY)
      .style("stroke-opacity", 0)
      .remove();
    plotVelocitiesGroup
      .selectAll("line.live")
      .transition()
      .duration(LIVE_STAY)
      .style("stroke-opacity", 0)
      .remove();
    this.isoPositions = [];
    for (var i = 0; i < num; i++) {
      this.isoPositions[i] = {
        x: testDimension.cx + (d / 2) * Math.cos((2 * Math.PI * i) / num),
        y: testDimension.cy + (d / 2) * Math.sin((2 * Math.PI * i) / num),
        w: w,
      };
    }
  },

  removeTarget: function () {
    testAreaSVG.selectAll("#target").data([]).exit().remove();
    this.active = false;
  },

  mouseClicked: function (x, y) {
    if (!this.roundInProgress) return;

    const isHit = distance({ x: x, y: y }, this.target) < this.target.w / 2;
    const error = isHit ? 0 : 1;

    // 1. 성공/실패 여부와 관계없이 데이터 기록
    this.addDataPoint(
      {
        start: this.start,
        target: this.target,
        path: this.currentPath,
        hit: { x: x, y: y, t: new Date().getTime() },
      },
      error
    );

    // 2. 시행 횟수 증가
    this.trialsInCurrentBlock++;

    // 3. 현재 블록(ID)의 시행 횟수가 9번이 되었는지 확인
    if (this.trialsInCurrentBlock >= 9) {
      // 9번 채웠으면 다음 조건으로 이동
      this.currentConditionIndex++;

      // 모든 조건을 다 했는지 확인
      if (this.currentConditionIndex >= this.sessionOrder.length) {
        // 다 했으면 실험 종료
        this.endRound();
        return;
      } else {
        // 아직 남았으면 다음 조건 블록 시작
        this.startNextBlock();
        return;
      }
    }

    this.removeTarget();
    this.generateTarget();

    // 5. 다음 시행을 위해 시작점 초기화
    this.last = { x: x, y: y, t: new Date().getTime() };
    this.start = this.last;
    this.currentPath = [this.last];
    this.updateProgressText(); // 진행도 텍스트 업데이트
  },
  mouseMoved: function (x, y) {
    if (this.active) {
      if (this.last.x && x == this.last.x && this.last.y && y == this.last.y) {
        return;
      }
      if (this.updateTimeoutHandle) {
        window.clearTimeout(this.updateTimeoutHandle);
      }
      this.updateTimeoutHandle = window.setTimeout(
        () => this.updatePlots(this),
        UPDATE_DELAY
      );
      var newPoint = { x: x, y: y, t: new Date().getTime() };
      this.currentPath.push(newPoint);
      var dt = newPoint.t - this.last.t;
      var dist = distance(this.last, { x: x, y: y });
      var speed = dt > 0 ? dist / dt : 0;
      /*testAreaSVG
        .append("line")
        .attr("x1", this.last.x)
        .attr("x2", newPoint.x)
        .attr("y1", this.last.y)
        .attr("y2", newPoint.y)
        .style("stroke", v(speed))
        .transition()
        .duration(5000)
        .style("stroke-opacity", 0)
        .remove();*/
      //start 하고 커서 움직일 때마다 검은 선으로 자취가 보이는 코드
      this.last = newPoint;
    }
  },

  addDataPoint: function (data, error) {
    var dt = data.hit.t - data.start.t;
    var dist = distance(data.target, data.start);
    var id = shannon(dist, data.target.w);
    this.roundData.push({
      time: dt,
      distance: data.target.distance,
      width: data.target.w,
      hit: data.hit,
      start: data.start,
      target: data.target,
      path: data.path,
      error: error,
    });

    if (error === 0) {
      scatterGroup
        .append("circle")
        .style("fill", this.roundColour)
        .attr("cx", scatterX(id))
        .attr("cy", scatterY(dt))
        .attr("r", 0)
        .transition()
        .duration(200)
        .ease("bounce")
        .attr("r", 3);
    }
  },

  randomizeParams: function () {
    this.isoParams.distance = Math.floor(
      randomAB(this.isoLimits.minD, this.isoLimits.maxD)
    );
    this.isoParams.width = Math.floor(
      randomAB(this.isoLimits.minW, this.isoLimits.maxW)
    );
    $("#sliderDistance").slider("value", this.isoParams.distance);
    $("#sliderWidth").slider("value", this.isoParams.width);
    this.updateISOCircles();
    d3.select("#sliderDistanceValue").text(this.isoParams.distance);
    d3.select("#sliderWidthValue").text(this.isoParams.width);
  },

  // ==================== 여기가 통째로 수정된 부분입니다 ====================
  updatePlots: function (that) {
    const dataToProcess = that.roundInProgress ? that.roundData : that.data;

    // 1. 모든 데이터에 IDe와 Throughput 값을 계산하여 채워넣기
    const processDataSet = (dataSet) => {
      if (dataSet.length === 0) return;

      // 타겟 조건(거리+너비)에 따라 모든 데이터를 그룹화
      var groups = {};
      dataSet.forEach((datum) => {
        const groupID = datum.distance.toString() + datum.width.toString();
        if (!groups[groupID]) {
          groups[groupID] = [];
        }
        groups[groupID].push(datum);
      });

      // 각 그룹의 대표 IDe 값을 계산 (성공한 데이터 기준)
      var groupMetrics = {};
      for (const groupID in groups) {
        const successfulTrialsInGroup = groups[groupID].filter(
          (d) => d.error === 0
        );

        if (successfulTrialsInGroup.length > 0) {
          // 성공 데이터가 1개 이상이면 계산
          successfulTrialsInGroup.forEach((d) => {
            const q = project(d.start, d.target, d.hit);
            d.projectedHitOffsetY =
              distance(q, d.hit) * isLeft(d.start, d.target, d.hit);
            d.projectedHitOffsetX = distance(q, d.target) * sign(q.t - 1);
            d.realDistance = distance(d.start, d.hit);
          });

          const xEffective =
            4.133 *
            Math.sqrt(
              variance(successfulTrialsInGroup, (d) => d.projectedHitOffsetX)
            );
          const yEffective =
            4.133 *
            Math.sqrt(
              variance(successfulTrialsInGroup, (d) => d.projectedHitOffsetY)
            );
          const We = Math.min(xEffective, yEffective);
          const De = mean(successfulTrialsInGroup, (d) => d.realDistance);

          groupMetrics[groupID] = { IDe: shannon(De, We) };
        }
      }

      // 모든 데이터(성공, 실패 포함)에 IDe와 Throughput 값을 할당
      dataSet.forEach((datum) => {
        const groupID = datum.distance.toString() + datum.width.toString();
        if (groupMetrics[groupID]) {
          datum.IDe = groupMetrics[groupID].IDe;
          if (datum.time > 0) {
            datum.throughput = 1000 * (datum.IDe / datum.time);
          }
        }
      });
    };

    if (that.roundInProgress) {
      processDataSet(that.roundData);
    } else {
      for (var key in that.data) {
        if (that.data.hasOwnProperty(key)) {
          processDataSet(that.data[key].data);
        }
      }
    }

    // 2. 그래프 그리기 (기존 로직과 유사)
    scatterEffectiveGroup.selectAll("*").remove();
    throughputGroup.selectAll("*").remove();
    positionEffectiveGroup.selectAll("*").remove();
    speedEffectiveGroup.selectAll("*").remove();

    // 축 그리기
    scatterEffectiveGroup
      .append("g")
      .attr("class", "axis")
      .call(
        effXAxis
          .tickSize(scatterEffectiveDimension.innerHeight)
          .orient("bottom")
      );
    scatterEffectiveGroup
      .append("g")
      .attr("class", "axis")
      .call(
        effYAxis.tickSize(-scatterEffectiveDimension.innerWidth).orient("left")
      );
    // ... 다른 축들도 필요 시 추가

    var dataSetIndex = -1;
    for (var key in that.data) {
      if (!that.data.hasOwnProperty(key)) continue;
      dataSetIndex++;

      const successfulTrials = that.data[key].data.filter(
        (d) => d.error === 0 && d.IDe
      );
      if (successfulTrials.length === 0) continue;

      var colour = that.data[key].colour;

      // IDe 분산 그래프
      scatterEffectiveGroup
        .selectAll("circle.cat" + key)
        .data(successfulTrials)
        .enter()
        .append("circle")
        .attr("class", "cat" + key)
        .style("fill", colour)
        .style("opacity", 0.5)
        .attr("cx", (d) => effScatterX(d.IDe))
        .attr("cy", (d) => effScatterY(d.time))
        .attr("r", 5);

      // 회귀선
      const covTIDe = cov(
        successfulTrials,
        (d) => d.time,
        (d) => d.IDe
      );
      const varIDe = variance(successfulTrials, (d) => d.IDe);
      const b = varIDe > 0 ? covTIDe / varIDe : 0;
      const mT = mean(successfulTrials, (d) => d.time);
      const mIDe = mean(successfulTrials, (d) => d.IDe);
      const a = mT - b * mIDe;

      if (!isNaN(a)) {
        scatterEffectiveGroup
          .append("line")
          .attr("class", "cat" + key)
          .style("stroke", colour)
          .style("stroke-width", 2)
          .attr("x1", 0)
          .attr("x2", scatterEffectiveDimension.innerWidth)
          .attr("y1", effScatterY(a + b * 0.5))
          .attr("y2", effScatterY(a + b * 6.5));
      }
    }
  },
};

// ... (cov, variance, mean, etc. - 이전과 동일)
function cov(data, extractorA, extractorB) {
  if (data.length <= 1) {
    return 0;
  }
  var mA = mean(data, extractorA);
  var mB = mean(data, extractorB);
  var cov = 0;
  for (var i = 0; i < data.length; i++) {
    cov += (extractorA(data[i]) - mA) * (extractorB(data[i]) - mB);
  }
  return cov / (data.length - 1);
}
function variance(data, extractor) {
  return cov(data, extractor, extractor);
}
function mean(data, extractor) {
  if (data.length === 0) return 0;
  var sum = 0;
  for (var i = 0; i < data.length; i++) {
    sum += extractor(data[i]);
  }
  return sum / data.length;
}
function randomAB(a, b) {
  return a + Math.random() * (b - a);
}
function assSize(assArr) {
  var size = 0;
  for (var _ in assArr) {
    size++;
  }
  return size;
}
function assFirstKey(assArr) {
  for (var key in assArr) {
    return key;
    break;
  }
}
function assIsKey(needle, assArr) {
  for (var key in assArr) {
    if (needle == key) {
      return true;
    }
  }
  return false;
}
function project(A, B, p) {
  var AB = minus(B, A);
  var AB_squared = dot(AB, AB);
  if (AB_squared == 0) {
    return A;
  } else {
    var Ap = minus(p, A);
    var t = dot(Ap, AB) / AB_squared;
    return { x: A.x + t * AB.x, y: A.y + t * AB.y, t: t };
  }
}
function mouseMoved() {
  var m = d3.svg.mouse(this);
  fittsTest.mouseMoved(m[0], m[1]);
}
function mouseClicked() {
  var m = d3.svg.mouse(this);
  fittsTest.mouseClicked(m[0], m[1]);
}
function dot(a, b) {
  return a.x * b.x + a.y * b.y;
}
function isLeft(A, B, p) {
  return (B.x - A.x) * (p.y - A.y) - (B.y - A.y) * (p.x - A.x) >= 0 ? 1 : -1;
}
function minus(a, b) {
  return { x: a.x - b.x, y: a.y - b.y };
}
function distance(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
}
function sign(a) {
  return a >= 0 ? 1 : -1;
}
function rgb2Hex(r, g, b) {
  return (
    "#" +
    clampInt(0, 255, r).toString(16) +
    clampInt(0, 255, g).toString(16) +
    clampInt(0, 255, b).toString(16)
  );
}
function clampInt(lower, upper, x) {
  return Math.min(upper, Math.max(lower, Math.floor(x)));
}
function shannon(A, W) {
  if (W <= 0) return 0; // 너비가 0 이하일 경우 0을 반환하여 에러 방지
  return Math.log(A / W + 1) / Math.log(2);
}
function bgRect(d, dim) {
  return d
    .append("rect")
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("width", dim.width)
    .attr("height", dim.height)
    .attr("class", "back");
}

// ... (SVG, plot, group, axis 생성 코드 - 이전과 동일)
var testAreaSVG = d3
  .select("#test-area")
  .append("svg")
  .attr("width", testDimension.width)
  .attr("height", testDimension.height)
  .style("pointer-events", "all")
  .on("mousemove", mouseMoved)
  .on("mousedown", mouseClicked)
  .call(bgRect, testDimension);

testAreaSVG
  .append("text")
  .attr("id", "progressText")
  .attr("x", testDimension.width / 2)
  .attr("y", 20)
  .attr("text-anchor", "middle")
  .style("font-family", "sans-serif")
  .style("font-size", "14px")
  //.text("실험 준비");
var plotPositionSVG = d3
  .select("#plot-positions")
  .append("svg")
  .attr("width", plotPositionDimension.width)
  .attr("height", plotPositionDimension.height)
  .call(bgRect, plotPositionDimension);
var plotPositionGroup = plotPositionSVG
  .append("g")
  .attr(
    "transform",
    "translate(" +
      plotPositionDimension.left +
      ", " +
      plotPositionDimension.top +
      ")"
  );
var positionXAxis = d3.svg.axis().scale(scaleX).ticks(7);
var positionYAxis = d3.svg.axis().scale(scaleY).ticks(6);
plotPositionGroup
  .append("g")
  .attr("class", "axis")
  .call(
    positionXAxis.tickSize(plotPositionDimension.innerHeight).orient("bottom")
  );
plotPositionGroup
  .append("g")
  .attr("class", "axis")
  .call(
    positionYAxis.tickSize(-plotPositionDimension.innerWidth).orient("left")
  );
var plotHitsSVG = d3
  .select("#plot-hits")
  .append("svg")
  .attr("width", plotHitsDimension.width)
  .attr("height", plotHitsDimension.height)
  .call(bgRect, plotHitsDimension);
var plotHitsGroup = plotHitsSVG
  .append("g")
  .attr(
    "transform",
    "translate(" + plotHitsDimension.cx + ", " + plotHitsDimension.cy + ")"
  );
plotHitsGroup
  .append("circle")
  .attr("cx", 0)
  .attr("cy", 0)
  .attr("r", plotHitsDimension.innerWidth / 2)
  .style("opacity", 0.1);
plotHitsGroup
  .append("line")
  .attr("x1", 0)
  .attr("y1", 0)
  .attr("x2", -plotHitsDimension.cx)
  .attr("y2", 0);
plotHitsGroup
  .append("line")
  .attr("x1", 0)
  .attr("y1", 0)
  .attr("x2", -10)
  .attr("y2", -10);
plotHitsGroup
  .append("line")
  .attr("x1", 0)
  .attr("y1", 0)
  .attr("x2", -10)
  .attr("y2", 10);
var plotVelocitiesSVG = d3
  .select("#plot-velocities")
  .append("svg")
  .attr("width", plotVelocitiesDimension.width)
  .attr("height", plotVelocitiesDimension.height)
  .call(bgRect, plotVelocitiesDimension);
var plotVelocitiesGroup = plotVelocitiesSVG
  .append("g")
  .attr(
    "transform",
    "translate(" +
      plotVelocitiesDimension.left +
      ", " +
      plotVelocitiesDimension.top +
      ")"
  );
var speedXAxis = d3.svg.axis().scale(scaleT).ticks(7);
var speedYAxis = d3.svg.axis().scale(scaleV).ticks(6);
plotVelocitiesGroup
  .append("g")
  .attr("class", "axis")
  .call(
    speedXAxis.tickSize(plotVelocitiesDimension.innerHeight).orient("bottom")
  );
plotVelocitiesGroup
  .append("g")
  .attr("class", "axis")
  .call(
    speedYAxis.tickSize(-plotVelocitiesDimension.innerWidth).orient("left")
  );
var scatterSVG = d3
  .select("#plot-scatter")
  .append("svg")
  .attr("width", plotScatterDimension.width)
  .attr("height", plotScatterDimension.height)
  .call(bgRect, plotScatterDimension);
var scatterGroup = scatterSVG
  .append("g")
  .attr(
    "transform",
    "translate(" +
      plotScatterDimension.left +
      "," +
      plotScatterDimension.top +
      " )"
  );
var xAxis = d3.svg.axis().scale(scatterX).ticks(7).tickSize(6, 3, 0);
var yAxis = d3.svg.axis().scale(scatterY).ticks(6).tickSize(6, 3, 6);
scatterGroup
  .append("g")
  .attr("class", "axis")
  .call(xAxis.tickSize(plotScatterDimension.innerHeight).orient("bottom"));
scatterGroup
  .append("g")
  .attr("class", "axis")
  .call(yAxis.tickSize(-plotScatterDimension.innerWidth).orient("left"));
var scatterEffectiveSVG = d3
  .select("#scatterEffective")
  .append("svg")
  .attr("width", scatterEffectiveDimension.width)
  .attr("height", scatterEffectiveDimension.height)
  .call(bgRect, scatterEffectiveDimension);
var scatterEffectiveGroup = scatterEffectiveSVG
  .append("g")
  .attr(
    "transform",
    "translate(" +
      scatterEffectiveDimension.left +
      "," +
      scatterEffectiveDimension.top +
      " )"
  );
var effXAxis = d3.svg.axis().scale(effScatterX).ticks(10).tickSize(6, 3, 0);
var effYAxis = d3.svg.axis().scale(effScatterY).ticks(10).tickSize(6, 3, 6);
scatterEffectiveGroup
  .append("g")
  .attr("class", "axis")
  .call(
    effXAxis.tickSize(scatterEffectiveDimension.innerHeight).orient("bottom")
  );
scatterEffectiveGroup
  .append("g")
  .attr("class", "axis")
  .call(
    effYAxis.tickSize(-scatterEffectiveDimension.innerWidth).orient("left")
  );
var throughputSVG = d3
  .select("#throughput")
  .append("svg")
  .attr("width", histDimension.width)
  .attr("height", histDimension.height)
  .call(bgRect, histDimension);
var throughputGroup = throughputSVG
  .append("g")
  .attr(
    "transform",
    "translate(" + histDimension.left + "," + histDimension.top + " )"
  );
var positionEffectiveSVG = d3
  .select("#positionEffective")
  .append("svg")
  .attr("width", positionEffectiveDimension.width)
  .attr("height", positionEffectiveDimension.height)
  .call(bgRect, positionEffectiveDimension);
var positionTargetsGroup = positionEffectiveSVG
  .append("g")
  .attr(
    "transform",
    "translate(" +
      positionEffectiveDimension.left +
      "," +
      positionEffectiveDimension.top +
      " )"
  );
var positionEffectiveGroup = positionEffectiveSVG
  .append("g")
  .attr(
    "transform",
    "translate(" +
      positionEffectiveDimension.left +
      "," +
      positionEffectiveDimension.top +
      " )"
  );
var positionEffXAxis = d3.svg
  .axis()
  .scale(effPositionX)
  .ticks(10)
  .tickSize(-positionEffectiveDimension.innerHeight);
var positionEffYAxis = d3.svg
  .axis()
  .scale(effPositionY)
  .ticks(5)
  .tickSize(-positionEffectiveDimension.innerWidth);
positionEffectiveGroup
  .append("g")
  .attr("class", "axis")
  .attr(
    "transform",
    "translate(0, " + positionEffectiveDimension.innerHeight + ")"
  )
  .call(positionEffXAxis.orient("bottom"));
positionEffectiveGroup
  .append("g")
  .attr("class", "axis")
  .call(positionEffYAxis.orient("left"));
var speedEffectiveSVG = d3
  .select("#speedEffective")
  .append("svg")
  .attr("width", speedEffectiveDimension.width)
  .attr("height", speedEffectiveDimension.height)
  .call(bgRect, speedEffectiveDimension);
var speedEffectiveGroup = speedEffectiveSVG
  .append("g")
  .attr(
    "transform",
    "translate(" +
      speedEffectiveDimension.left +
      "," +
      speedEffectiveDimension.top +
      " )"
  );
var speedEffXAxis = d3.svg
  .axis()
  .scale(effSpeedX)
  .ticks(10)
  .tickSize(-speedEffectiveDimension.innerHeight);
var speedEffYAxis = d3.svg
  .axis()
  .scale(effSpeedY)
  .ticks(5)
  .tickSize(-speedEffectiveDimension.innerWidth);
speedEffectiveGroup
  .append("g")
  .attr("class", "axis")
  .attr(
    "transform",
    "translate(0, " + speedEffectiveDimension.innerHeight + ")"
  )
  .call(speedEffXAxis.orient("bottom"));
speedEffectiveGroup
  .append("g")
  .attr("class", "axis")
  .call(speedEffYAxis.orient("left"));

// ... (Start 버튼, Countdown, Fullscreen 기능 코드 - 이전과 동일)
var startButtonGroup = testAreaSVG
  .append("g")
  .attr("id", "startButton")
  .style("cursor", "pointer")
  .on("mousedown", function () {
    d3.event.stopPropagation();
    fittsTest.startRound();
  });
startButtonGroup
  .append("circle")
  .attr("cx", testDimension.cx)
  .attr("cy", testDimension.cy)
  .attr("r", 40)
  .style("fill", "black");
startButtonGroup
  .append("text")
  .attr("x", testDimension.cx)
  .attr("y", testDimension.cy + 5)
  .attr("text-anchor", "middle")
  .style("fill", "white")
  .style("font-size", "16px")
  .style("font-family", "sans-serif")
  .text("Start");
testAreaSVG
  .append("text")
  .attr("id", "countdown")
  .attr("x", 20)
  .attr("y", 30)
  .style("font-size", "18px")
  .style("font-family", "sans-serif")
  .style("display", "none");
const testAreaElement = document.getElementById("test-area");
const fullscreenButton = document.getElementById("fullscreenBtn");
// ... fullscreenButton을 정의한 코드 바로 아래에 추가

// 화면 크기 표시를 위한 text 요소 추가
testAreaSVG
  .append("text")
  .attr("id", "dimensionText")
  .style("font-size", "16px")
  .style("font-family", "sans-serif")
  .style("text-anchor", "end") // 텍스트를 오른쪽 정렬
  .style("display", "none"); // 처음에는 숨겨둠

function renderAllDataSetsUI() {
  d3.select("#dataSets").html(""); // 기존 목록을 비웁니다.
  for (const num in fittsTest.data) {
    if (fittsTest.data.hasOwnProperty(num)) {
      const dataSet = fittsTest.data[num];
      const div = d3
        .select("#dataSets")
        .append("div")
        .attr("id", "dataSet" + num)
        .attr("class", "dataSetItem")
        .style("background-color", dataSet.colour)
        .style("color", "white");

      div.append("span").text("Data Set " + num);
      const buttonGroup = div.append("div").attr("class", "button-group");

      buttonGroup
        .append("button")
        .attr("type", "button")
        .text("CSV")
        .on("click", () => {
          d3.event.stopPropagation();
          downloadDataAsCSV({ [num]: dataSet }, `fitts_law_dataset_${num}.csv`);
        });

      buttonGroup
        .append("button")
        .attr("type", "button")
        .text("삭제")
        .on("click", () => {
          d3.event.stopPropagation();
          fittsTest.deleteDataSet(num);
        });
    }
  }
}
function resizeTestArea() {
  const newWidth = testAreaElement.clientWidth;
  const newHeight = testAreaElement.clientHeight;
  // 화면 크기 텍스트를 "너비 X 높이" 형식으로 업데이트
  d3.select("#dimensionText")
    .attr("x", newWidth - 20) // 오른쪽에서 20px 안쪽
    .attr("y", 30) // 위에서 30px 아래쪽
    .text(`${newWidth} X ${newHeight}`);
  testAreaSVG.attr("width", newWidth).attr("height", newHeight);
  testAreaSVG.select(".back").attr("width", newWidth).attr("height", newHeight);
  testDimension = makeDimension(newWidth, newHeight, 30, 30, 30, 30);
  fittsTest.updateISOCircles();
  d3.select("#startButton")
    .select("circle")
    .attr("cx", testDimension.cx)
    .attr("cy", testDimension.cy);
  d3.select("#startButton")
    .select("text")
    .attr("x", testDimension.cx)
    .attr("y", testDimension.cy + 5);
}
function openFullscreen(elem) {
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if (elem.webkitRequestFullscreen) {
    elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) {
    elem.msRequestFullscreen();
  }
}
function closeFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen();
  }
}
fullscreenButton.addEventListener("click", () => {
  if (!document.fullscreenElement) {
    openFullscreen(testAreaElement);
  } else {
    closeFullscreen();
  }
});
document.addEventListener("fullscreenchange", () => {
  if (document.fullscreenElement) {
    // 전체화면으로 들어왔을 때
    fullscreenButton.textContent = "원래 화면으로";
    d3.select("#dimensionText").style("display", "block"); // 화면 크기 텍스트를 보여줌
    resizeTestArea();
  } else {
    // 전체화면에서 빠져나왔을 때
    fullscreenButton.textContent = "전체화면으로 시작";
    d3.select("#dimensionText").style("display", "none"); // 화면 크기 텍스트를 숨김
    testAreaSVG.attr("width", 620).attr("height", 400);
    testAreaSVG.select(".back").attr("width", 620).attr("height", 400);
    resizeTestArea();
  }
});
// init code
fittsTest.active = false;
fittsTest.generateISOPositions(15, 150, 10);
fittsTest.updateISOCircles();
d3.select("#sliderDistanceValue").text(fittsTest.isoParams.distance);
d3.select("#sliderWidthValue").text(fittsTest.isoParams.width);

// setup sliders
$("#sliderDistance").slider({
  min: fittsTest.isoLimits.minD,
  max: fittsTest.isoLimits.maxD,
  step: 1,
  value: fittsTest.isoParams.distance,
  slide: function (event, ui) {
    fittsTest.isoParams.distance = ui.value;
    fittsTest.updateISOCircles();
    d3.select("#sliderDistanceValue").text(ui.value);
  },
});
$("#sliderWidth").slider({
  min: fittsTest.isoLimits.minW,
  max: fittsTest.isoLimits.maxW,
  step: 1,
  value: fittsTest.isoParams.width,
  slide: function (event, ui) {
    fittsTest.isoParams.width = ui.value;
    fittsTest.updateISOCircles();
    d3.select("#sliderWidthValue").text(ui.value);
  },
});

// 통합 다운로드 버튼
$("#downloadCSVButton").click(function () {
  // 다운로드 전에 항상 최신 데이터로 업데이트
  fittsTest.updatePlots(fittsTest);
  downloadDataAsCSV(fittsTest.data, "fitts_law_all_data.csv");
});
$("#deleteAllBtn").click(function () {
  if (confirm("정말로 모든 데이터를 영구적으로 삭제하시겠습니까?")) {
    // 로컬 스토리지에서 데이터 삭제
    localStorage.removeItem("fittsLawData");

    // 현재 프로그램의 데이터도 초기화
    fittsTest.data = {};
    fittsTest.dataCnt = 0;

    // UI 업데이트
    renderAllDataSetsUI();
    fittsTest.updatePlots(fittsTest);
    alert("모든 데이터가 삭제되었습니다.");
  }
});

// 페이지 로드 시 로컬 스토리지에서 데이터 불러오기
window.onload = function () {
  const savedData = localStorage.getItem("fittsLawData");
  if (savedData) {
    fittsTest.data = JSON.parse(savedData);
    // dataCnt를 가장 큰 키 값으로 설정
    const keys = Object.keys(fittsTest.data);
    fittsTest.dataCnt = keys.length > 0 ? Math.max(...keys.map(Number)) : 0;
    // UI 다시 그리기
    renderAllDataSetsUI();
    fittsTest.updatePlots(fittsTest);
  }
};
function downloadDataAsCSV(dataSets, fileName) {
  fileName = fileName || "fitts_law_data.csv";

  let csvContent = "data:text/csv;charset=utf-8,";

  // 1. 헤더 순서 변경: hitY 다음에 distance, 그 다음에 error 추가
  const headers = [
    "dataSet",
    "trialNum",
    "targetDistance",
    "targetWidth",
    "movementTime_ms",
    "ID_bits",
    "IDe_bits",
    "throughput_bits_sec",
    "startX",
    "startY",
    "targetX",
    "targetY",
    "hitX",
    "hitY",
    "distance",
    "error",
  ];
  csvContent += headers.join(",") + "\r\n";

  for (const setKey in dataSets) {
    if (!dataSets.hasOwnProperty(setKey)) continue;
    const set = dataSets[setKey];
    set.data.forEach((trial, index) => {
      const id = shannon(trial.distance, trial.width);

      // 2. target과 hit 좌표 사이의 유클리디안 거리 계산
      const hit_distance = distance(trial.target, trial.hit);

      const id_val = id ? id.toFixed(4) : "";
      const ide_val = trial.IDe ? trial.IDe.toFixed(4) : "";
      const throughput_val = trial.throughput
        ? trial.throughput.toFixed(4)
        : "";

      // 3. 행 데이터에 계산된 거리(hit_distance) 추가
      const row = [
        setKey,
        index + 1,
        trial.distance,
        trial.width,
        trial.time,
        id_val,
        ide_val,
        throughput_val,
        trial.start.x,
        trial.start.y,
        trial.target.x,
        trial.target.y,
        trial.hit.x,
        trial.hit.y,
        hit_distance.toFixed(4), // 계산된 거리 값 추가
        trial.error,
      ];
      csvContent += row.join(",") + "\r\n";
    });
  }

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
