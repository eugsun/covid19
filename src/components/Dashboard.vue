<template>
    <section id="dashboard" class="section">
        <div class="level">
            <div class="level-item has-text-centered">
                <div>
                    <p class="heading">Date</p>
                    <p class="title">{{ date }}</p>
                    <p id="state-list">{{ snapshotStatesStr }}</p>
                </div>
            </div>
            <div class="level-item has-text-centered">
                <div>
                    <p class="heading">Cumulative Tests</p>
                    <p class="title">{{ totalTests }}</p>
                    <p>{{ percentTested }} of population</p>
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
 export default {
     name: 'Dashboard',
     computed: {
         date: function () {
             const dateStr = this.$store.state.snapshotDate.toString()
             return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6)}`
         },
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
             const statesStr = "In " + states.join(", ")
             return states.length > 0 ? statesStr : "USA"
         }
     }
 }
</script>

<style scope>
 #state-list {
     max-width: 30rem;
 }
</style>
