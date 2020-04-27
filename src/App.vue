<template>
    <div id="app">
        <Dashboard :key="dashKey" />
        <Chart :key="chartKey" />
        <footer class="footer">
            <div class="container">
                <p>By <a href="https://twitter.com/eugsun">@eugsun</a></p>
                <p>Data provided by <a href="https://covidtracking.com">The COVID Tracking Project</a></p>
                <p><a href="https://github.com/eugsun/covid19">Source</a></p>
            </div>
        </footer>
    </div>
</template>

<script>
 import Dashboard from './components/Dashboard.vue'
 import Chart from './components/Chart.vue'

 export default {
     name: 'App',
     computed: {
         dashKey: function () {
             let datasets = this.$store.state.chartData.datasets ?? []
             return `dash:${datasets.length}`
         },
         chartKey: function () {
             let datasets = this.$store.state.chartData.datasets ?? []
             return `chart:${datasets.length}`
         }
     },
     components: {
         Dashboard, Chart
     },
     mounted () {
         this.$store.dispatch("retrieveUSData");
         this.$store.dispatch("retrieveStatesData");
     }
 }
</script>

<style lang="scss">
 @import "~bulma/bulma";

 #app {
     font-family: Avenir, Helvetica, Arial, sans-serif;
 }
</style>
