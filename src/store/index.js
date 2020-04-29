import Vue from "vue"
import Vuex from "vuex"

import ColorPalette from "@/utils/ColorPalette"
import USPopulations from "@/utils/USPopulations"
import USStates from "@/utils/USStates"

import { SET_SNAPSHOT, SET_STATES_DATA, SET_CHART_DATA,
         TOGGLE_STATE_HIDDEN, CLEAR_SNAPSHOT, SET_CHART_TYPE } from "./mutations.js"

Vue.use(Vuex)

function getColor(index) {
  index = index ?? 0;
  return `#${ColorPalette.colors[index]}`
}

function getDefaultSnapshot() {
  return {
    lastModified: "",
    population: 0,
    totalTestResults: 0,
    positive: 0,
    death: 0,
    percentTested: 0,
    percentPositive: 0,
    percentDead: 0,
    totalTestResultsIncrease: 0,
    positiveIncrease : 0,
    deathIncrease: 0,
  };
}

export default new Vuex.Store({
  state: {
    usPopulation: 330579861,
    snapshotStates: new Set(),
    snapshotDate: null,
    snapshot: getDefaultSnapshot(),
    dates: [],
    datasetMap: new Map(),
    chartConfig: {
      labels: [],
      movingAvgDays: 7,
      lookbackDays: 30,
    },
    chartData: {},
    chartType: "positiveIncrease",
  },
  getters: {},
  mutations: {
    [SET_SNAPSHOT] (state, { useGlobal, label }) {
      let usa = state.datasetMap.get("USA")
      if (!usa) {
        return
      }

      useGlobal = useGlobal ?? false
      let dataSource = useGlobal ? usa : state.datasetMap.get(label)

      let dates = Array.from(dataSource.metadata.keys())
      dates.sort()
      dates.reverse()
      let lastDate = dates[0]
      let date = state.snapshotDate ?? lastDate

      // TODO: De-uglify the processing to include/exclude country-wide numbers
      if (label === "USA" && state.snapshotStates.size > 0) {
        return;
      } else if (state.snapshotStates.size >= 1 && state.snapshotStates.has("USA")) {
        state.snapshot.totalTestResults -= usa.metadata.get(date).totalTestResults
        state.snapshot.positive -= usa.metadata.get(date).positive
        state.snapshot.death -= usa.metadata.get(date).death
        state.snapshotStates.delete("USA")
      }

      state.snapshot.lastModified = dataSource.metadata.get(date).lastModified
      state.snapshot.totalTestResults += dataSource.metadata.get(date).totalTestResults ?? 0
      state.snapshot.positive += dataSource.metadata.get(date).positive ?? 0
      state.snapshot.death += dataSource.metadata.get(date).death ?? 0
      state.snapshot.totalTestResultsIncrease += dataSource.metadata.get(date).totalTestResultsIncrease ?? 0
      state.snapshot.positiveIncrease += dataSource.metadata.get(date).positiveIncrease ?? 0
      state.snapshot.deathIncrease += dataSource.metadata.get(date).deathIncrease ?? 0

      // Use the states' combined population instead of the US population
      let population = 0
      if (useGlobal || label === "USA") {
        population = state.usPopulation
      } else {
        let populationData = USPopulations.data.find(
          (item) => item["State"].toLowerCase() === USStates[label].toLowerCase())
        population = populationData ? populationData["Population"] : 0
      }
      state.snapshot.population += population

      state.snapshot.percentTested  = state.snapshot.totalTestResults / state.snapshot.population
      state.snapshot.percentPositive = state.snapshot.positive / state.snapshot.totalTestResults
      state.snapshot.percentDead = state.snapshot.death / state.snapshot.positive

      if (label) {
        state.snapshotStates.add(label)
      }
    },
    [SET_STATES_DATA] (state, {statesData, label}) {
      let labelSet = new Set();
      // state.datasetMap = new Map();
      statesData.forEach(function(d, i) {
        let identifier = label ? label : d.state
        labelSet.add(d.date);
        if (!state.datasetMap.has(identifier)) {
          let stateColor = getColor(i);
          state.datasetMap.set(identifier, {
            label: identifier,
            data: [],
            metadata: new Map(),
            borderColor: stateColor,
            backgroundColor: stateColor,
            hidden: true,
            fill: false,
          })
        }
        let metadata = state.datasetMap.get(identifier).metadata;
        metadata.set(d.date, {
          totalTestResultsIncrease: d.totalTestResultsIncrease,
          positiveIncrease : d.positiveIncrease,
          deathIncrease: d.deathIncrease,
          totalTestResults: d.totalTestResults,
          positive: d.positive,
          death: d.death,
          lastModified: d.dateChecked,
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
            dataset.data.push(dataset.metadata.get(dateLabel)[state.chartType]);
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

          let transformed = prev < 0.001 ?
              1 : dataset.data[i] * 1.0 / prev;
          prev = dataset.data[i];
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
          avgGrowthFactors.push(val);
        }
        dataset.data = avgGrowthFactors.slice(
          avgGrowthFactors.length - state.chartConfig.lookbackDays,
          avgGrowthFactors.length);
      });

      state.chartData = {
        labels: state.dates.slice(state.dates.length - state.chartConfig.lookbackDays, state.dates.length),
        datasets: datasets,
      };
    },
    [TOGGLE_STATE_HIDDEN] (state, { label, isHidden }) {
      if (!state.datasetMap.has(label)) {
        return
      }
      if (isHidden !== undefined) {
        state.datasetMap.get(label).hidden = isHidden;
      } else {
        state.datasetMap.get(label).hidden = !state.datasetMap.get(label).hidden;
      }
    },
    [CLEAR_SNAPSHOT] (state, { date, label }) {
      if (state.snapshotDate !== date
          || (state.snapshotDate === date && state.snapshotStates.has(label))) {
        state.snapshotDate = date;
        state.snapshot = getDefaultSnapshot();
        state.snapshotStates = new Set();
      }
    },
    [SET_CHART_TYPE] (state, chartType) {
      state.chartType = chartType;
    }
  },
  actions: {
    retrieveUSData (context) {
      const api = "https://covidtracking.com/api/v1/us/daily.json";
      fetch(api)
        .then((response) => {
          return response.json();
        })
        .then((data) => {
          context.commit(SET_STATES_DATA, {statesData: data, label: "USA"});
          context.commit(SET_CHART_DATA, {});
          context.commit(SET_SNAPSHOT, { useGlobal: true });
        });
    },
    retrieveStatesData (context) {
      const api = "https://covidtracking.com/api/states/daily";
      fetch(api)
        .then((response) => {
          return response.json();
        })
        .then((data) => {
          context.commit(SET_STATES_DATA, {statesData: data});
          context.commit(SET_CHART_DATA, {});
        });
    },
    updateChart (context, {lookbackDays, movingAvgDays}) {
      context.commit(SET_CHART_DATA, {
        lookbackDays: lookbackDays,
        movingAvgDays: movingAvgDays,
      });
    },
    toggleStateHidden (context, { label, isHidden }) {
      context.commit(TOGGLE_STATE_HIDDEN, { label: label, isHidden: isHidden })
      context.commit(SET_CHART_DATA, {});
    },
    setSnapshotForLabel (context, { date, label }) {
      context.commit(CLEAR_SNAPSHOT, { date: date, label: label })
      context.commit(SET_SNAPSHOT, { label: label })
    },
    setChartType (context, chartType) {
      let chart = "positiveIncrease";
      switch (chartType) {
        case "tests":
          chart = "totalTestResultsIncrease";
          break;
        case "deaths":
          chart = "deathIncrease"
          break;
      }
      context.commit(SET_CHART_TYPE, chart)
      context.commit(SET_CHART_DATA, {})
    },
  },
  modules: {
  }
})
