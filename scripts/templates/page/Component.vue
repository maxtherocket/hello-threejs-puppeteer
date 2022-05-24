<template>
  <div class="{{pascal}} section global__page">
    <h1 class="{{pascal}}__heading">
      Page: {{pascal}}
    </h1>
  </div>
</template>

<script>
  export default {
    name : '{{pascal}}',
    mounted() {
    },
    metaInfo() {
      return {
        title : '{{title}}',
        meta : []
      };
    }
  };
</script>

<style lang="scss">
  .{{pascal}} {
    display: flex;
    flex-flow: column nowrap;
    align-items: center;
    justify-content: center;
    &__heading {
      text-align: center;
      font-size: 30px;
      color: $black;
    }
  }
</style>
