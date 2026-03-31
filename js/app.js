// App entry point — orchestrates all modules
(async function () {
  'use strict';

  await Projects.load();
  Projects.render(false);
  Effects.init();
  Admin.init();
})();
