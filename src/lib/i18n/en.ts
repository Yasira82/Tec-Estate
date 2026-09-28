export const en = {
  common: {
    appName:  'TEC',
    tagline:  'The Elite Consortium',
    login:    'Sign in with Pi',
    logout:   'Logout',
    loading:  'Loading...',
    comingSoon: 'Coming Soon',
    live:     'Live',
  },
  dashboard: {
    greeting:   'Welcome,',
    welcomeNew: '🎉 Welcome to TEC — Your account is ready',
    stats: {
      piBalance:     'Pi Balance',
      tecWallet:     'TEC Wallet',
      availableApps: 'Available Apps',
      activeApp:     'Active',
      subscription:  'Subscription',
      upgradePro:    'Upgrade to Pro',
    },
    appsTitle: 'TEC Ecosystem',
    appsCount: '24 Apps',
  },
  estate: {
    brand:       'TEC Estate · Real Estate OS',
    // C19 — "no session" and "signed in, but the backend did not answer" are
    // different states; both used to say "Sign in with Pi".
    loadState: {
      signedOutTitle: '',
      signedOut:      'Sign in with Pi to see your property portfolio. Register a property to add one — it\'ll appear here.',
      downTitle:      '',
      down:           'You\'re signed in, but your portfolio didn\'t load just now. Try again in a moment — nothing is shown rather than a guess.',
    },
    welcome:     'Welcome',
    welcomeName: 'Welcome, {name}',
    subtitle:    'Everything about your property, in one place — track ownership, leasing, value, and upkeep as your needs change.',
    nav: { home: 'Home', portfolio: 'Portfolio', pro: 'Pro', settings: 'Settings' },
    lifecycle:   'The lifecycle',
    portfolio:   'Your Portfolio',
    footer:      'Estate helps you list, manage, and track your property. It doesn’t process full property sales or transfer legal title — those go through the proper legal channels.',
    settings: {
      profile: 'Profile', planFree: 'Free', planPro: 'Pro',
      connectedPi: 'Connected to Pi', notSignedIn: 'Not signed in', member: 'TEC Member',
      appearance: 'Appearance', language: 'Language', languageDesc: 'Display language',
      about: 'About', version: 'Version', domain: 'Domain', ecosystem: 'Ecosystem',
      builtOn: 'Built on', builtOnPi: 'Pi Network', logout: 'Logout',
    },
  },
};
