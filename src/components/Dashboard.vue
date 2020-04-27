<template>
    <section id="dashboard" class="section">
        <div class="level">
            <div class="level-item has-text-centered">
                <div>
                    <p class="heading">Date</p>
                    <p class="title">{{ lastModified }}</p>
                </div>
            </div>
            <div class="level-item has-text-centered">
                <div>
                    <p class="heading">Cumulative Tests</p>
                    <p class="title">{{ totalTests }}</p>
                    <p>{{ percentTested }} of population</p>
                </div>
            </div>
            <div class="level-item has-text-centered">
                <div>
                    <p class="heading">Cumulative Positive Cases</p>
                    <p class="title">{{ totalPositives }}</p>
                    <p>{{ percentPositive }} of all tests</p>
                </div>
            </div>
            <div class="level-item has-text-centered">
                <div>
                    <p class="heading">Cumulative Deaths</p>
                    <p class="title">{{ totalDeaths }}</p>
                    <p>{{ percentDead }} of all positives</p>
                </div>
            </div>
        </div>
    </section>
</template>

<script>
 export default {
     name: 'Dashboard',
     props: { },
     data () {
         return {};
     },
     computed: {
         lastModified: function () { return this.$store.state.snapshot.lastModified.split('T')[0] },
         totalTests: function () { return this.$store.state.snapshot.totalTestResults.toLocaleString() },
         totalPositives: function () { return this.$store.state.snapshot.positive.toLocaleString() },
         totalDeaths: function () { return this.$store.state.snapshot.death.toLocaleString() },
         percentTested: function () {
             return this.$store.state.snapshot.percentTested.toLocaleString('en', {style: 'percent', minimumFractionDigits: 2})
         },
         percentPositive: function () {
             return this.$store.state.snapshot.percentPositive.toLocaleString('en', {style: 'percent', minimumFractionDigits: 2})
         },
         percentDead: function () {
             return this.$store.state.snapshot.percentDead.toLocaleString('en', {style: 'percent', minimumFractionDigits: 2})
         },
     },
     mounted () {
     }
 }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="sass" scoped>
</style>
