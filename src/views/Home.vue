<template>
    <div id="home" v-if="ready">
        <Dashboard :key="dashKey" />
        <Chart :chart-type="chartType" :active-states="activeStates" :key="chartKey" />
        <footer class="footer">
            <div class="container">
                <p>By <a href="https://twitter.com/eugsun">@eugsun</a></p>
                <p>Data provided by <a href="https://covidtracking.com">The COVID Tracking Project</a>, which stopped data collection on March 7, 2021.</p>
                <p>Source code on <a href="https://github.com/eugsun/covid19">GitHub</a></p>
                <p>For a short background write-up see <a href="https://eugsun.com/tinkers/2020/covid19-dashboard/">here</a></p>
            </div>
        </footer>
    </div>
</template>

<script>
 import Dashboard from '@/components/Dashboard'
 import Chart from '@/components/Chart'

 export default {
     name: 'App',
     props: ["chartType", "activeStates"],
     computed: {
         ready: function () {
             return this.$store.state.ready
         },
         dashKey: function () {
             let usLoaded = this.$store.state.dataset.us ? "us-loaded" : "us-not-loaded"
             let numStatesLoaded = this.$store.state.dataset.states.length
             let numSelectedStates = this.$store.state.selectedStates.size
             return `dash:${usLoaded}:${numStatesLoaded}:${numSelectedStates}`
         },
         chartKey: function () {
             let usLoaded = this.$store.state.dataset.us ? "us-loaded" : "us-not-loaded"
             let numStatesLoaded = this.$store.state.dataset.states.length
             let numSelectedStates = this.$store.state.selectedStates.size
             return `chart:${usLoaded}:${numStatesLoaded}:${numSelectedStates}`
         }
     },
     components: {
         Dashboard, Chart
     },
     mounted () {
         this.$store.dispatch("retrieveAPIData")
     }
 }
</script>

<style lang="scss">
 @import "~bulma/bulma";

 #app {
     font-family: Avenir, Helvetica, Arial, sans-serif;
 }
</style>
