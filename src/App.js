import React from 'react';
import './App.css';
import ApiGateway from './gateways/ApiGateway';

const LOCAL_STORAGE_KEY = "api_call_count";

class Prompt extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      sort: 'none'
    };

    this.title = props.title;
    this.description = props.description;
    this.placeholder = props.placeholder;
    this.loading = props.loading;

    this.handleInputChange = this.handleInputChange.bind(this);
  }

  handleInputChange(event) {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;
    
    this.setState({
      [name]: value
    });
  }

  handleSubmit() {
    if (this.loading) {
      this.setState({errorMsg: "A query is in progress! Please wait!"});
    } else {
      if (this.state.query && this.state.query.trim().length > 0) {
        this.setState({errorMsg: ""});
        this.props.onSubmit(this.state)
      } else {
        this.setState({errorMsg: "Query can not be just spaces!"});
      }
    }
  }

  render() {
    return (
      <div className="box container">
        <h1>{this.title}</h1>
        <p>{this.description}</p>

        <div className="input-group">
          <input type="text" className="input--simple" name="query" onChange={this.handleInputChange} placeholder={this.placeholder || 'Enter Search...'}/>
        </div>
        <div className="input-group">
          <button type="button" className="button" onClick={() => this.handleSubmit()} disabled={this.loading || !this.state.query}>Search</button>  
        </div>
        <div className="input-group">
          <label>
            Sort By:
            <select name="sort" className="input--simple" value={this.state.sort} onChange={this.handleInputChange}>
            <option value="none">None</option>
              <option value="stars">Stars</option>
              <option value="forks">Forks</option>
              <option value="help-wanted-issues">Help Wanted Issues</option>
              <option value="updated">Recently Updated</option>
            </select>
          </label>
        </div>
        <p className="errorMsg">{this.state.errorMsg}</p>
      </div>
    );
  }
}

class Results extends React.Component {
  
  constructor(props) {
    super(props)
    this.hiddenRef = React.createRef();
    this.props = props;

    this.state = {
      showModal: false,
      userInfo: null,
      loading: true
    }

    this.copyLinkToClipboard = this.copyLinkToClipboard.bind(this);
    this.handleUserInfoClick = this.handleUserInfoClick.bind(this);
    this.onModalClose = this.onModalClose.bind(this);
  }

  // Create element and delete after it's done
  // element is used for taking advantage of base document copy to clipboard functionality
  copyLinkToClipboard() {
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.value = window.location.origin + this.props.query;
    input.select();
    document.execCommand("copy");
    document.body.removeChild(input);
  };

  getLocalLocation() {
    const location = window.location;
    return location.protocol + "//" + location.host + "/" + location.pathname.split('/')[1]
  }

  handleUserInfoClick(user) {
    this.setState({showModal: true});
    ApiGateway().get(user.url)
      .then(result => {
        this.setState({userInfo: result.data})
      })
      .finally(() => this.setState({loading:false}))
  }

  onModalClose() {
    this.setState({showModal: false, userInfo: null, loading: true});
  }
  
  render() {
    const props = this.props;

    return (
      <React.Fragment>
        {props.showStatus &&
          <div className="flex --row --centered query-summary">
            <div> Total Records: {props.totalRecords} </div>
            <div> Query: <span className="link" onClick={this.copyLinkToClipboard}>{props.query} <span className="tiny">click to copy/share</span></span>
            </div>
          </div>
        }
        <div className="grid">
          { props.data.map((item) => {
                return <Repo key={item.id} repo={item} handleUserInfoClick={this.handleUserInfoClick}></Repo>
            })
          }
        </div>
        {this.state.showModal && 
          <React.Fragment>
            <div className="modal-backdrop"></div>
            <div className="modal">
              <h2>User Details Modal</h2>
              <div className="modal__content">
                {this.state.loading && 
                <div className="spinner">
                  <div className="double-bounce1"></div>
                  <div className="double-bounce2"></div>
                </div>}

                {!this.state.loading  && this.state.userInfo &&
                  <React.Fragment>
                    <img src={this.state.userInfo.avatar_url} alt={this.state.userInfo.login} className="user-icon"></img>
                    <div className="username">{this.state.userInfo.login}</div>

                    <div className="flex --column --centered">
                      <div className="--mt">
                        <strong>Location: </strong>{this.state.userInfo.location || "No Location Set!"}
                      </div>
                      <div className="--mt">
                        <strong>Bio: </strong>{this.state.userInfo.bio || "No Bio Set!"}
                      </div>
                      <div className="--mt">
                        <strong>Github: </strong>
                        <a target="_blank" className="link" href={this.state.userInfo.url}>{this.state.userInfo.url}</a>  
                      </div>
                    </div>
                  </React.Fragment>
                }

              </div>
              <div className="modal__actions">
                <button className="button" onClick={this.onModalClose}>
                  close
                </button>
              </div>
            </div>
          </React.Fragment>
        }
        
      </React.Fragment>
      );
  }
}


const Repo = (props) => {
  const repo = props.repo;
  const repo_link = repo.html_url;
  const owner = repo.owner;
  const name = repo.name;
  const description = repo.description;
  const stars = repo.stargazers_count;
  const language = repo.language;

  const handleUserInfoClick = () => {
    props.handleUserInfoClick(owner);
  }

  return ( <div className="flex card">
      <div className="user-info">
        <img src={owner.avatar_url} alt={owner.login} className="user-icon link" onClick={handleUserInfoClick}></img>
        <div className="username link" onClick={handleUserInfoClick}>{owner.login}</div>
      </div>
      <div className="repo-desc">
        <div className="repo-name">
          <a href={repo_link} target="_blank" className="link">{name}</a>
        </div>
        <p><i className="far fa-star"></i>{stars} <span className={language + " language"}>{language}</span></p>
        <p>{description}</p>
      </div>
    </div>
  )
}



class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      query: "",
      totalCount: 0,
      data: [],
      showStatus: false,
      loading: false
    }

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    const params = new URLSearchParams(window.location.search)
    if (params.has('q')) {
      this.handleSubmit({
        query: params.get('q'),
        sort: params.get('sort')
      })
    }
  }

  updateGithubApiCount() {
    const localStorage = window.localStorage;
    let count = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!count) {
      localStorage.setItem(LOCAL_STORAGE_KEY, "1")
    } else {
      count = (parseInt(count) + 1).toString();
      localStorage.setItem(LOCAL_STORAGE_KEY, count)
    }
  }
  
  handleSubmit(vals) {
    if (vals) {
      this.updateGithubApiCount()
      this.setState({loading:true});
      ApiGateway().getGitHubRepos(vals).then(result => {
        if (result.status === 200) {
          this.setState({
            query: ApiGateway().buildQuery(vals),
            data: result.data.items, 
            totalCount: result.data.total_count, 
            showStatus: true});
        } else {
          //todo display some error
          console.log("error in retrieving");
        }
      }).finally(() => {
        this.setState({loading:false});
      })
    }
  }

  render() {
    const data = [{repo: 'mock'}]
    return (
      <div className="App">
        <Prompt 
          title="Simple Github API Webapp"
          loading={this.state.loading}
          description="Enter your query for repos below and click the button to display results."
          onSubmit={this.handleSubmit}
          ></Prompt>
          {this.state.loading && 
          <div className="spinner">
            <div className="double-bounce1"></div>
            <div className="double-bounce2"></div>
          </div>}
        {!this.state.loading && 
        <Results data={this.state.data} totalRecords={this.state.totalCount} query={this.state.query} showStatus={this.state.showStatus}></Results>}
      </div>
    );
  }
  
}

export default App;
