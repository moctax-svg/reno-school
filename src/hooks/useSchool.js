import { useState, useEffect } from 'react';
import { School } from '../api/entities';

let _cache = null;
let _listeners = [];

export function useSchool() {
  const [school, setSchool] = useState(_cache);
  const [loading, setLoading] = useState(!_cache);

  useEffect(() => {
    if (_cache) { setSchool(_cache); setLoading(false); return; }
    _listeners.push(setSchool);
    if (_listeners.length === 1) {
      School.list().then(list => {
        _cache = list[0] || null;
        _listeners.forEach(fn => fn(_cache));
        _listeners = [];
      }).catch(() => { _listeners = []; });
    }
    setLoading(false);
    return () => { _listeners = _listeners.filter(fn => fn !== setSchool); };
  }, []);

  function refreshSchool() {
    _cache = null;
    School.list().then(list => {
      _cache = list[0] || null;
      setSchool(_cache);
    }).catch(() => {});
  }

  return { school, loading, refreshSchool };
}
