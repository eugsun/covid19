<template>
    <div id="app">
        <Dashboard />
        <Chart />
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
     components: {
         Dashboard, Chart
     },
     mounted () {
         this.$store.dispatch("retrieveStatesData");
         this.$store.dispatch("retrieveUSSnapshot");
     }
 }
</script>

<style lang="scss">
 @import "~bulma/bulma";

 #app {
     font-family: Avenir, Helvetica, Arial, sans-serif;
 }
</style>
