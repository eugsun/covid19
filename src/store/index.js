import Vue from 'vue'
import Vuex from 'vuex'

import { SET_US_SNAPSHOT, SET_STATES_DATA, SET_CHART_DATA, TOGGLE_STATE_HIDDEN } from "./mutations.js"

Vue.use(Vuex)

function getRandomColorRgb() {
  let red = Math.floor(Math.random() * 256);
  let green = Math.floor(Math.random() * 256);
  let blue = Math.floor(Math.random() * 256);
  return `rgb(${red}, ${green}, ${blue})`;
}

export default new Vuex.Store({
  state: {
    usPopulation: 330579861,
    snapshot: {
      lastModified: "",
      totalTestResults: 0,
      positive: 0,
      death: 0,
    },
    dates: [],
    datasetMap: new Map(),
    chartConfig: {
      labels: [],
      movingAvgDays: 7,
      lookbackDays: 30,
    },
    chartData: {
    },
  },
  getters: {
    percentTested (state) {
      return state.snapshot.totalTestResults / state.usPopulation
    },
    percentPositive (state) {
      return state.snapshot.positive / state.snapshot.totalTestResults
    },
    percentDead (state) {
      return state.snapshot.death / state.snapshot.positive
    },
  },
  mutations: {
    [SET_US_SNAPSHOT] (state, snapshot) {
      state.snapshot = snapshot;
    },
    [SET_STATES_DATA] (state, statesData) {
      let labelSet = new Set();
      state.datasetMap = new Map();
      statesData.forEach(function(d) {
        labelSet.add(d.date);
        if (!state.datasetMap.has(d.state)) {
          let stateColor = getRandomColorRgb();
          state.datasetMap.set(d.state, {
            label: d.state,
            data: [],
            metadata: new Map(),
            borderColor: stateColor,
            backgroundColor: stateColor,
            hidden: d.state != "NY" && d.state != "MD",
            fill: false,
          })
        }
        let metadata = state.datasetMap.get(d.state).metadata;
        metadata.set(d.date, {
          positiveIncrease : d.positiveIncrease,
          deathIncrease: d.deathIncrease,
        });
      });
      state.dates = Array.from(labelSet);
      state.dates.sort();
    },
    [SET_CHART_DATA] (state, chartConfig) {
      state.chartConfig.movingAvgDays = chartConfig.movingAvgDays ?? state.chartConfig.movingAvgDays;
      state.chartConfig.lookbackDays = chartConfig.lookbackDays ?? state.chartConfig.lookbackDays;

      let datasets = Array.from(state.datasetMap.values());
      datasets.forEach(function(dataset) {
        // dataset.data.reverse();
        state.dates.forEach(function(dateLabel) {
          if (dataset.metadata.has(dateLabel)) {
            dataset.data.push(dataset.metadata.get(dateLabel).positiveIncrease);
          } else {
            dataset.data.push(0);
          }
        });

        let originals = [0];
        let growthFactors = [1];
        let avgGrowthFactors = [];

        let prev = dataset.data[0];
        for (let i = 1; i < dataset.data.length; i++) {
          originals.push(dataset.data[i]);

          let transformed = prev < 0.1 ?
              1 : dataset.data[i] * 1.0 / prev;
          prev = dataset.data[i];
          dataset.data[i] = transformed;
          growthFactors.push(transformed);
        }
        let n = state.chartConfig.movingAvgDays;
        for (let i = 0; i < n; i++) {
          avgGrowthFactors.push(1.0);
        }
        for (let i = n; i < growthFactors.length; i++) {
          let sumOriginal = originals.slice(i-n, i)
                                     .reduce((a, b) => a+b, 0) / n;
          let sumOriginalNow = originals.slice(i-n+1, i+1)
                                        .reduce((a, b) => a+b, 0) / n;
          let val = sumOriginalNow < 0.1 || sumOriginal < 0.1 ? 1 : sumOriginalNow / sumOriginal;
          // console.log(`for ${i}: ${sumOriginal} => ${sumOriginalNow} Grew by ${val}`);
          avgGrowthFactors.push(val);
        }
        // dataset.data = avgGrowthFactors;
        dataset.data = avgGrowthFactors.slice(
          avgGrowthFactors.length - state.chartConfig.lookbackDays,
          avgGrowthFactors.length);
      });

      state.chartData = {
        labels: state.dates.slice(state.dates.length - state.chartConfig.lookbackDays, state.dates.length),
        datasets: datasets,
      };
    },
    [TOGGLE_STATE_HIDDEN] (state, { label }) {
      state.datasetMap.get(label).hidden = !state.datasetMap.get(label).hidden;
    }
  },
  actions: {
    retrieveUSSnapshot (context) {
      const api = "https://covidtracking.com/api/v1/us/current.json";
      fetch(api)
        .then((response) => {
          return response.json();
        })
        .then((data) => {
          context.commit(SET_US_SNAPSHOT, data[0]);
        });
    },
    retrieveStatesData (context) {
      const api = "https://covidtracking.com/api/states/daily";
      fetch(api)
        .then((response) => {
          return response.json();
        })
        .then((data) => {
          context.commit(SET_STATES_DATA, data);
          context.commit(SET_CHART_DATA, {});
        });
    },
    updateChart (context, {lookbackDays, movingAvgDays}) {
      context.commit(SET_CHART_DATA, {
        lookbackDays: lookbackDays,
        movingAvgDays: movingAvgDays,
      });
    },
    toggleStateHidden (context, { label }) {
      context.commit(TOGGLE_STATE_HIDDEN, { label: label })
      context.commit(SET_CHART_DATA, {});
    }
  },
  modules: {
  }
})
