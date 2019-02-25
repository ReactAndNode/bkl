const randomString = (length) => {
  const x = 36 ** (length + 1);
  const y = 36 ** length;
  return Math.round(x - (Math.random() * y)).toString(36).slice(1);
};

const pages = [
  {
    route: '/',
    title: 'Bowen K Liu',
    heading: 'ABOUT THIS SITE',
  },
  {
    route: '/about',
    title: 'About | Bowen K Liu',
    heading: 'ABOUT ME',
  },
  {
    route: '/projects',
    title: 'Projects | Bowen K Liu',
    heading: 'PROJECTS',
  },
  {
    route: '/stats',
    title: 'Stats | Bowen K Liu',
    heading: 'STATS',
  },
  {
    route: '/contact',
    title: 'Contact | Bowen K Liu',
    heading: 'CONTACT',
  },
];

export { pages, randomString };
