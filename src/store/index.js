import Vue from "vue"
import Vuex from "vuex"

import ColorPalette from "@/utils/ColorPalette"
import USPopulations from "@/utils/USPopulations"
import USStates from "@/utils/USStates"

import { SET_SNAPSHOT_DATE, SET_STATES_DATA, SET_CHART_DATA,
         TOGGLE_STATE_HIDDEN, SET_CHART_TYPE, TOGGLE_US_SELECT } from "./mutations.js"

Vue.use(Vuex)

function getColor(index) {
  index = index ?? 0;
  return `#${ColorPalette.colors[index]}`
}

export default new Vuex.Store({
  state: {
    snapshotDate: "",

    selectedStates: [],
    isUSSelected: true,

    dates: [],
    dataset: {
      us: null,
      states: new Map(),
    },

    chartConfig: {
      labels: [],
      movingAvgDays: 7,
      lookbackDays: 30,
    },
    chartData: {},
    chartType: "positiveIncrease",
  },
  getters: {
    snapshot: state => {
      let result = {
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
      }

      let usa = state.dataset.us
      if (!usa) {
        return result
      }
      const date = state.snapshotDate
      if (date === undefined) {
        return result
      }

      if (state.selectedStates.length > 0) {
        result.population = state.selectedStates.map((label) => USStates[label].toLowerCase())
                                 .map((name) => USPopulations.data.find((item) => item["State"].toLowerCase() === name)["Population"])
                                 .reduce((acc, curr) => (acc ?? 0) + (curr ?? 0))
      } else {
        result.population = 330579861  // From somewhere on the interwebs
      }

      if (state.selectedStates.length > 0) {
        state.selectedStates.forEach((label) => {
          let dataSource = state.dataset.states.get(label)
          result.totalTestResults += dataSource.metadata.get(date).totalTestResults ?? 0
          result.positive += dataSource.metadata.get(date).positive ?? 0
          result.death += dataSource.metadata.get(date).death ?? 0
          result.totalTestResultsIncrease += dataSource.metadata.get(date).totalTestResultsIncrease ?? 0
          result.positiveIncrease += dataSource.metadata.get(date).positiveIncrease ?? 0
          result.deathIncrease += dataSource.metadata.get(date).deathIncrease ?? 0
        })
      } else { // if no state is selected, use USA aggregate data
        let usa = state.dataset.us
        result.totalTestResults = usa.metadata.get(date).totalTestResults
        result.positive = usa.metadata.get(date).positive
        result.death = usa.metadata.get(date).death
        result.totalTestResultsIncrease = usa.metadata.get(date).totalTestResultsIncrease
        result.positiveIncrease = usa.metadata.get(date).positiveIncrease
        result.deathIncrease = usa.metadata.get(date).deathIncrease
      }

      result.percentTested  = result.totalTestResults / result.population
      result.percentPositive = result.positive / result.totalTestResults
      result.percentDead = result.death / result.positive
      return result
    },
  },
  mutations: {
    [SET_SNAPSHOT_DATE] (state, date) {
      if (date === undefined) {
        let dates = Array.from(state.dataset.us.metadata.keys())
        dates.sort()
        state.snapshotDate = dates.pop()
      } else {
        state.snapshotDate = date
      }
    },
    [SET_STATES_DATA] (state, {data, label}) {
      let newMap = new Map()
      let labelSet = new Set()
      data.forEach(function(d, i) {
        let identifier = label ? label : d.state
        labelSet.add(d.date);
        let stateColor = label ? "#dddddd" : getColor(i);
        if (!newMap.has(identifier)) {
          newMap.set(identifier, {
            label: identifier,
            data: [],
            metadata: new Map(),
            borderColor: stateColor,
            backgroundColor: stateColor,
            hidden: true,
            fill: false,
          })
        }
        newMap.get(identifier).metadata.set(d.date, {
          totalTestResultsIncrease: d.totalTestResultsIncrease,
          positiveIncrease : d.positiveIncrease,
          deathIncrease: d.deathIncrease,
          totalTestResults: d.totalTestResults,
          positive: d.positive,
          death: d.death,
          lastModified: d.dateChecked,
        });
      });

      if (label === "USA") {
        state.dataset.us = newMap.get("USA")
      } else {
        state.dataset.states = newMap
      }
      state.dates = Array.from(labelSet);
      state.dates.sort();
    },
    [SET_CHART_DATA] (state, chartConfig) {
      state.chartConfig.movingAvgDays = chartConfig.movingAvgDays ?? state.chartConfig.movingAvgDays;
      state.chartConfig.lookbackDays = chartConfig.lookbackDays ?? state.chartConfig.lookbackDays;

      let datasets = Array.from(state.dataset.states.values());
      if (state.isUSSelected && state.dataset.us) {
        datasets.push(state.dataset.us)
      }
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
      if (!state.dataset.states.has(label)) {
        return
      }
      state.dataset.states.get(label).hidden = isHidden;
      const i = state.selectedStates.indexOf(label)
      if (isHidden && i > -1) {
        state.selectedStates.splice(i, 1)
      } else if (!isHidden && i < 0) {
        state.selectedStates.push(label)
      }
    },
    [SET_CHART_TYPE] (state, chartType) {
      state.chartType = chartType
    },
    [TOGGLE_US_SELECT] (state, value) {
      state.isUSSelected = value
      if (state.dataset.us) {
        state.dataset.us.hidden = !value
      }
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
          context.commit(SET_STATES_DATA, {data: data, label: "USA"});
          context.commit(SET_CHART_DATA, {});
          context.commit(SET_SNAPSHOT_DATE)
        });
    },
    retrieveStatesData (context) {
      const api = "https://covidtracking.com/api/v1/states/daily.json";
      fetch(api)
        .then((response) => {
          return response.json();
        })
        .then((data) => {
          context.commit(SET_STATES_DATA, {data: data});
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
    setSnapshotForLabel (context, { date }) {
      context.commit(SET_SNAPSHOT_DATE, date)
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
    toggleUSSelect (context, value) {
      context.commit(TOGGLE_US_SELECT, value)
      context.commit(SET_CHART_DATA, {})
    }
  },
  modules: {
  }
})
