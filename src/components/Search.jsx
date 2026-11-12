import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIntl } from 'react-intl';
import searchIcon from '../assets/searchIcon.svg';
import { CATEGORIES } from '../constants/categories';
import { client } from '../lib/amplify';
import { run } from '../lib/api';
import './Search.css';

/** Search box with autocomplete over category names and worker names. */
export default function Search() {
  const intl = useIntl();
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [workerNames, setWorkerNames] = useState([]);

  useEffect(() => {
    run(client.models.Service.list({ selectionSet: ['workerName'], limit: 1000 }))
      .then((services) => setWorkerNames([...new Set(services.map((service) => service.workerName))]))
      .catch((error) => console.warn('[search] could not load worker names', error));
  }, []);

  const options = useMemo(() => {
    const query = text.trim().toLowerCase();
    if (!query) {
      return [];
    }
    const categories = CATEGORIES.map((category) => intl.formatMessage({ id: category.messageId }));
    return [...categories, ...workerNames].filter((option) => option.toLowerCase().includes(query));
  }, [text, workerNames, intl]);

  function search() {
    const query = text.trim();
    if (!query) {
      return;
    }
    const category = CATEGORIES.find(
      (item) => intl.formatMessage({ id: item.messageId }).toLowerCase() === query.toLowerCase(),
    );
    navigate(
      category
        ? `/services/results?category=${category.key}`
        : `/services/results?q=${encodeURIComponent(query)}`,
    );
  }

  return (
    <form
      className="searchBar"
      onSubmit={(event) => {
        event.preventDefault();
        search();
      }}
    >
      <button type="submit" className="searchBarBut" aria-label={intl.formatMessage({ id: 'Search' })}>
        <img className="searchIcon" src={searchIcon} alt="" />
      </button>
      <input
        type="text"
        id="searchText"
        placeholder={intl.formatMessage({ id: 'Search' })}
        list="searchOptions"
        value={text}
        onChange={(event) => setText(event.target.value)}
      />
      <datalist id="searchOptions">
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </form>
  );
}
