/** Shared authored stories keep markup, scroll length and card stops in sync. */
export const lifeScenes = [
  {
    id: 'detail', media: '/whoof/life-gallery/detail', category: 'Незаметная забота',
    title: ['Маленький трекер.', 'Большая близость.'],
    description: 'Около 8 граммов — чтобы быть рядом с собакой каждый день.',
    alt: 'Камера облетает маленький трекер на плетёном ремешке',
  },
  {
    id: 'activity', media: '/whoof/life-story/activity', category: 'Активность',
    title: ['Сколько движения', 'в его дне.'],
    description: 'Whoof показывает уровень активности — на прогулке и дома.',
    alt: 'Собака поворачивает голову, на шее трекер Whoof',
  },
  {
    id: 'outside', media: '/whoof/life-gallery/outside', category: 'На прогулке',
    title: ['У каждого', 'свой темп.'],
    description: 'Сравнивайте активность с его привычным ритмом, а не с чужими рекордами.',
    alt: 'Собака на зелёной траве поднимает голову и смотрит в камеру',
  },
  {
    id: 'rest', media: '/whoof/life-story/rest', category: 'Сон и отдых',
    title: ['Знать, как', 'он отдыхает.'],
    description: 'Продолжительность сна и активность — в одной истории дня.',
    alt: 'Лабрадор спокойно спит на мягкой лежанке',
  },
  {
    id: 'daytime', media: '/whoof/life-extra/daytime', category: 'Пока вы заняты',
    title: ['А как прошёл', 'его день?'],
    description: 'Загляните в приложение: активность и сон складываются в понятную картину.',
    alt: 'Собака отдыхает на спине на своей лежанке в светлой комнате',
  },
  {
    id: 'routine', media: '/whoof/life-extra/routine', category: 'Привычный ритм',
    title: ['Один день —', 'ещё не всё.'],
    description: 'Смотрите активность и сон за неделю, чтобы замечать изменения.',
    alt: 'Лабрадор ест из миски дома',
  },
  {
    id: 'together', media: '/whoof/life-story/together', category: 'Время вместе',
    title: ['Лучше понимать.', 'Больше быть рядом.'],
    description: 'История в приложении помогает замечать перемены в его привычном ритме.',
    alt: 'Лабрадор даёт лапу девочке во время игры дома',
  },
] as const;
