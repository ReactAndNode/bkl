import dayjs from 'dayjs';

/* Keys returned by the github api. The other keys in the array below
 * are mostly jokes. These are the keys the github api query searches for.
 */
export const githubKeys = [
  'stargazers_count',
  'watchers_count',
  'forks',
  'open_issues_count',
  'subscribers_count',
  'pushed_at',
];

// TODO To be provided by an API
const data = [
  // {
  //   label: 'Stars this repository has on github',
  //   key: 'stargazers_count',
  //   value: '0',
  //   link: 'https://github.com/mldangelo/personal-site/stargazers',
  // },
];

export default data;
