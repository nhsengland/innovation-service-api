const custom = require('@digitalroute/cz-conventional-changelog-for-jira/configurable');
const defaultTypes = require('@digitalroute/cz-conventional-changelog-for-jira/types');

module.exports = custom({
  types: {
    ...defaultTypes,
    perf: {
      description: 'Improvements that will make your code perform better',
      title: 'Performance'
    }
  },
  skipScope: true,
  jiraPrefix: 'NHSAAC',
});