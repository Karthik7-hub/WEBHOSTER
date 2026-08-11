const vanilla = require('./vanilla');
const reactCdn = require('./reactCdn');
const landing = require('./landing');
const portfolio = require('./portfolio');
const blog = require('./blog');
const empty = require('./empty');

/**
 * Returns starter boilerplate contents based on template name.
 */
function getTemplateFiles(templateName, projectName) {
  switch (templateName) {
    case 'vanilla':
      return vanilla(projectName);
    case 'react':
    case 'react-cdn':
      return reactCdn(projectName);
    case 'landing':
    case 'saas':
      return landing(projectName);
    case 'portfolio':
      return portfolio(projectName);
    case 'blog':
      return blog(projectName);
    case 'empty':
    default:
      return empty(projectName);
  }
}

module.exports = {
  getTemplateFiles
};
