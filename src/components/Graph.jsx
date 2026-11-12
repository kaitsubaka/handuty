import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useIntl } from 'react-intl';
import { categoryMessageId } from '../constants/categories';
import { client, guestClient } from '../lib/amplify';
import { run } from '../lib/api';
import { useSession } from '../context/Session';

const WIDTH = 700;
const HEIGHT = 500;
const MARGIN = { top: 10, left: 100, bottom: 40, right: 20 };
const TICK_STEP = 5;

/** Bar chart of how many distinct workers offer each category. */
export default function Graph() {
  const intl = useIntl();
  const { status } = useSession();
  const canvas = useRef(null);
  const [data, setData] = useState([]);

  useEffect(() => {
    if (status === 'loading') {
      return;
    }
    const api = status === 'signedOut' ? guestClient : client;
    run(api.models.Service.list({ selectionSet: ['category', 'workerId'], limit: 1000 }))
      .then((services) => {
        const workers = new Map();
        for (const service of services) {
          const set = workers.get(service.category) ?? new Set();
          set.add(service.workerId);
          workers.set(service.category, set);
        }
        setData([...workers].map(([category, ids]) => ({ category, count: ids.size })));
      })
      .catch((error) => console.warn('[graph] could not load services', error));
  }, [status]);

  useEffect(() => {
    const root = d3.select(canvas.current);
    root.selectAll('*').remove();
    const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
    const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
    const maxCount = Math.max(0, ...data.map((d) => d.count));
    const svg = root
      .append('svg')
      .attr('viewBox', `0 0 ${WIDTH} ${HEIGHT}`)
      .attr('width', '100%')
      .attr('role', 'img')
      .attr('aria-label', intl.formatMessage({ id: 'Descubre' }))
      .style('max-width', `${WIDTH}px`)
      .style('background-color', 'white');
    const chart = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);
    const x = d3
      .scaleLinear()
      .domain([0, (Math.floor(maxCount / TICK_STEP) + 1) * TICK_STEP])
      .range([0, innerWidth]);
    const y = d3
      .scaleBand()
      .domain(data.map((d) => intl.formatMessage({ id: categoryMessageId(d.category) })))
      .range([0, innerHeight])
      .padding(0.1);
    chart
      .append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(d3.axisBottom(x).ticks(Math.min(10, x.domain()[1])).tickFormat(d3.format('d')));
    chart.append('g').call(d3.axisLeft(y));
    chart
      .selectAll('rect')
      .data(data)
      .join('rect')
      .attr('x', 0)
      .attr('y', (d) => y(intl.formatMessage({ id: categoryMessageId(d.category) })))
      .attr('height', y.bandwidth())
      .attr('width', (d) => x(d.count))
      .attr('fill', '#373842');
    svg
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('x', MARGIN.left + innerWidth / 2)
      .attr('y', HEIGHT - 6)
      .attr('font-size', '1em')
      .text(intl.formatMessage({ id: 'xD3' }));
    svg
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('transform', 'rotate(-90)')
      .attr('x', -(MARGIN.top + innerHeight / 2))
      .attr('y', 14)
      .attr('font-size', '1em')
      .text(intl.formatMessage({ id: 'yD3' }));
  }, [data, intl]);

  return <div ref={canvas} />;
}
