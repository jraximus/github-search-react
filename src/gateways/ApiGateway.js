const axios = require('axios').default;

export default function ApiGateway(){
    const URL = 'https://api.github.com/search/repositories'
  
    const getGitHubRepos = (options) => {
        return axios.get(URL + buildQuery(options));
    }

    const buildQuery = (options) => {
        let query = "?q=" + encodeURI((options.query || "").trim()).replace(/(%20)+/g, ' ').split(' ').join('+');
        if (options.sort && options.sort !== 'none') {
            query += `&sort=${options.sort}`;
        }
        return query;
    }

    const get = (url) => {
        return axios.get(url);
    }
    
    return  Object.freeze({
        get,
        getGitHubRepos,
        buildQuery
    });
}
