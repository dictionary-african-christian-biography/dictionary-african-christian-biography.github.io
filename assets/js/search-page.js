(() => {
  const pageLang = document.documentElement.lang;
  const asyncLightweightSearch = async (query) =>
    new Promise((resolve) => {
      if (window.getLightweightSearchResults) resolve(getLightweightSearchResults(query, pageLang));
      const checkInterval = setInterval(() => {
        if (window.getLightweightSearchResults) {
          clearInterval(checkInterval);
          resolve(getLightweightSearchResults(query));
        }
      }, 250);
    });
  const asyncSearch = async (query) =>
    new Promise((resolve) => {
      if (window.getSearchResults) resolve(getSearchResults(query, pageLang));
      const checkInterval = setInterval(() => {
        if (window.getSearchResults) {
          clearInterval(checkInterval);
          resolve(getSearchResults(query));
        }
      }, 250);
    });

  const searchInput = document.querySelector('.full-search input');
  const searchInputContainer = document.querySelector('.full-search .input-container');
  const searchPredictions = document.querySelector('.full-search .predictions');
  searchInput.addEventListener('focus', (e) => {
    searchPredictions.style.display = 'block';
    searchInputContainer.classList.remove('input-blurred');
    updatePredictions();
  });
  searchInput.addEventListener('blur', (e) => {
    // if it was the result of a click on a prediction, wait for that event to process first
    setTimeout(() => {
      searchPredictions.style.display = 'none';
      searchInputContainer.classList.add('input-blurred');
    }, 200);
  });
  const updatePredictions = async (e) => {
    const query = searchInput.value.trim();
    if (query.length > 0) {
      searchInputContainer.classList.add('active');
      asyncLightweightSearch(query).then((results) => {
        // add raw result of query -- show an item for the exact query typed
        results.unshift({ title: query });
        // remove pages with duplicate titles
        const resultsTitles = results.map((e) => e.title);
        results = results.filter((e, i) => i === resultsTitles.indexOf(e.title));
        // keep max 10 results
        results = results.slice(0, 10);
        // highlight where the query appears
        results = results.map((e, i) => ({ ...e, title: e.title.replace(new RegExp(query, 'gi'), (match) => `<strong>${match}</strong>`) }));
        // display results
        searchPredictions.innerHTML = results
          .map((e, i) => `<button ${i === 0 ? 'class="active"' : ''} onclick='searchFromPrediction(this);'>${e.title}</button>`)
          .join('');
      });
    } else {
      searchPredictions.innerHTML = '';
      searchInputContainer.classList.remove('active');
    }
  };
  searchInput.addEventListener('input', updatePredictions);
  searchInput.addEventListener('keydown', async (e) => {
    // check if user wants to execute a search
    if (e.key === 'Enter') {
      searchInput.blur();
      return executeSearch(searchInput.value);
    }

    // check if prediction has moved
    const activePrediction = document.querySelector('.full-search .predictions > button.active');
    const firstPrediction = document.querySelector('.full-search .predictions > button:first-child');
    const lastPrediction = document.querySelector('.full-search .predictions > button:last-child');
    if (activePrediction) {
      if (e.key === 'ArrowDown' && activePrediction !== lastPrediction) {
        activePrediction.classList.remove('active');
        activePrediction.nextElementSibling.classList.add('active');
      } else if (e.key === 'ArrowUp' && activePrediction !== firstPrediction) {
        activePrediction.classList.remove('active');
        activePrediction.previousElementSibling.classList.add('active');
      }
    }
    const newActivePrediction = document.querySelector('.full-search .predictions > button.active');
    if (newActivePrediction !== activePrediction) {
      searchInput.value = newActivePrediction.innerText;
    }
  });

  const convertURLIntoBreadcrumb = (url) => {
    const breadcrumb = ['DACB', ...url.replace(/\//g, ' ').trim().split(' ')];
    if (breadcrumb.indexOf('stories') > -1) {
      breadcrumb[breadcrumb.length - 1] = breadcrumb[breadcrumb.length - 1].replace(/\d/g, '');
    }
    return breadcrumb;
  };

  const searchResultsContainer = document.querySelector('.full-search .results');
  const searchPagination = document.querySelector('.full-search .pagination-list');
  const searchLoading = document.querySelector('.full-search .loading-spinner');
  const loadedInfo = document.querySelector('.full-search .loaded-info');
  const executeSearch = (query) => {
    const url = new URL(window.location.href);
    url.searchParams.set('query', query);
    history.pushState({}, 'Execute new search', url.href);
    updateSearchResults();
  };
  window.searchFromPrediction = (button) => executeSearch(button.innerText);
  const updateSearchResults = async () => {
    const startTime = new Date();
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('query');
    if (!query) return;
    searchInput.value = query;
    searchLoading.classList.add('active');
    asyncSearch(query).then((results) => {
      // remove duplicate results by URL
      const resultsURLs = results.map((e) => e.url);
      results = results.filter((e, i) => i === resultsURLs.indexOf(e.url));

      searchPredictions.innerHTML = '';

      const resultsPerPage = 15;
      let resultsPages = [];
      for (let i = 0; i < results.length; i += resultsPerPage) {
        resultsPages.push(results.slice(i, i + resultsPerPage));
      }
      searchResultsContainer.innerHTML = resultsPages
        .map(
          (e, i) =>
            `<div class='result-page ${i === 0 ? 'active' : ''}'>
            ${e
              .map(
                (item) => `
              <div class='result-item'>
                <div class='result-item-inner'>
                  <a href=${item.url}><h1>${item.title}</h1></a>
                  <h5><a href=${item.url}>${convertURLIntoBreadcrumb(item.url).join(' &nbsp;<kbd>&gt;</kbd>&nbsp; ')}</a></h5>
                  <p>${item.content}</p>
                </div>
                ${
                  item.imageURL
                    ? `
                <div class="image"><img src="${item.imageURL}" alt="${item.title}" /></div>
                `
                    : ''
                }
              </div>
            `
              )
              .join('')}
          </div>`
        )
        .join('');

      // loaded info
      if (results.length > 0) {
        const endTime = new Date();
        const resultsCount = results.length;
        const pagesCount = resultsPages.length;
        loadedInfo.innerText = `${resultsCount} result${resultsCount === 1 ? '' : 's'} (${pagesCount} page${pagesCount === 1 ? '' : 's'}) found in ${(
          (endTime.getTime() - startTime.getTime()) /
          1000
        ).toFixed(2)} seconds`;
      } else {
        loadedInfo.innerText = '';
      }

      // no results
      if (results.length === 0) {
        searchResultsContainer.innerHTML = `<h1 style='font-size: 1.4rem;'>No results found.</h1><p>Enter another search term or browse the site on <a href="/">our homepage</a>.</p>`;
      }

      // pagination
      searchPagination.innerHTML = '';
      if (resultsPages.length > 1) {
        searchPagination.innerHTML = new Array(resultsPages.length)
          .fill(0)
          .map((e, i) => i)
          .map(
            (e) => `<button ${e === 0 ? 'class="active"' : ''}
          onclick="
          this.parentElement.querySelector('.active').classList.remove('active');
          this.classList.add('active');
          this.parentElement.previousElementSibling.querySelector('.result-page.active').classList.remove('active');
          this.parentElement.previousElementSibling.querySelector('.result-page:nth-child(${e + 1})').classList.add('active');
          window.scrollTo({top: 0});
          "
          >${e + 1}</button>`
          )
          .join('');
      }
      searchLoading.classList.remove('active');
    });
  };

  updateSearchResults();
})();
