<template>
    <section class="section">
        <div id="dash-level" class="level">
            <div class="level-item has-text-centered">
                <div>
                    <p class="heading">Date</p>
                    <p class="title">{{ date }}</p>
                    <p>Population: {{ population }} K</p>
                    <p id="state-list">{{ snapshotStatesStr }}</p>
                </div>
            </div>
            <div class="level-item has-text-centered">
                <div>
                    <p class="heading">Cumulative Tests</p>
                    <p class="title">{{ totalTests }}</p>
                    <p class="tooltip">
                        {{ percentTested }} of population*
                        <span class="tooltiptext">
                            This is an estimation of the test coverage upper-bound,
                            since tests can be done multiple times for a single person.
                        </span>
                    </p>
                    <p>+{{ testIncrease }} from previous day</p>
                </div>
            </div>
            <div class="level-item has-text-centered">
                <div>
                    <p class="heading">Cumulative Positive Cases</p>
                    <p class="title">{{ totalPositives }}</p>
                    <p>{{ percentPositive }} of all tests</p>
                    <p>+{{ positiveIncrease }} from previous day</p>
                </div>
            </div>
            <div class="level-item has-text-centered">
                <div>
                    <p class="heading">Cumulative Deaths</p>
                    <p class="title">{{ totalDeaths }}</p>
                    <p>{{ percentDead }} of all positives</p>
                    <p>+{{ deathIncrease }} from previous day</p>
                </div>
            </div>
        </div>
    </section>
</template>

<script>
 import USStates from "@/utils/USStates"
 export default {
     name: 'Dashboard',
     computed: {
         date: function () {
             const dateStr = this.$store.state.snapshotDate.toString()
             return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6)}`
         },
         population: function () {
             return new Intl.NumberFormat()
                            .format(Math.floor(this.$store.getters.snapshot.population / 1000)) },
         totalTests: function () { return this.$store.getters.snapshot.totalTestResults.toLocaleString() },
         totalPositives: function () { return this.$store.getters.snapshot.positive.toLocaleString() },
         totalDeaths: function () { return this.$store.getters.snapshot.death.toLocaleString() },
         testIncrease: function () { return this.$store.getters.snapshot.totalTestResultsIncrease.toLocaleString() },
         positiveIncrease: function () { return this.$store.getters.snapshot.positiveIncrease.toLocaleString() },
         deathIncrease: function () { return this.$store.getters.snapshot.deathIncrease.toLocaleString() },
         percentTested: function () {
             return this.$store.getters.snapshot.percentTested.toLocaleString('en', {style: 'percent', minimumFractionDigits: 2})
         },
         percentPositive: function () {
             return this.$store.getters.snapshot.percentPositive.toLocaleString('en', {style: 'percent', minimumFractionDigits: 2})
         },
         percentDead: function () {
             return this.$store.getters.snapshot.percentDead.toLocaleString('en', {style: 'percent', minimumFractionDigits: 2})
         },
         snapshotStatesStr: function() {
             let states = Array.from(this.$store.state.selectedStates)
             if (states.length <= 0) {
                 return "USA"
             }
             const statesStr = Array.from(this.$store.state.selectedStates)
                                    .map((abbrev) => USStates[abbrev])
                                    .reduce((str, state, index, arr) => {
                                        if (index != arr.length - 1) {
                                            return `${str}, ${state}`
                                        } else {
                                            return`${str}, and ${state}`
                                        }
                                    })
             return statesStr
         }
     }
 }
</script>

<style scope>
 #dash-level {
     min-height: 10rem;
 }
 #state-list {
     max-width: 30rem;
 }

 .tooltip {
     position: relative;
     display: inline-block;
 }

 /* Tooltip text */
 .tooltip .tooltiptext {
     visibility: hidden;
     width: 20rem;
     background-color: #555;
     color: #fff;
     text-align: center;
     padding: 0.5rem;
     border-radius: 6px;

     /* Position the tooltip text */
     position: absolute;
     z-index: 1;
     top: 100%;
     left: 50%;
     margin-left: -10rem;

     /* Fade in tooltip */
     opacity: 0;
     transition: opacity 0.3s;
 }

 /* Show the tooltip text when you mouse over the tooltip container */
 .tooltip:hover .tooltiptext {
     visibility: visible;
     opacity: 1;
 }
</style>
