import { DATA_REFERENCE_TABLES, DATA_SOURCE_INFO } from '../lib/dataReference';

export function DataReferencePage() {
  return (
    <div className="page-stack">
      <section className="panel reference-source">
        <h2>Data Source</h2>
        <p>
          This dashboard uses finance data published by <strong>{DATA_SOURCE_INFO.organisation}</strong>.
        </p>
        <p>
          Source portal:{' '}
          <a href={DATA_SOURCE_INFO.portal} target="_blank" rel="noreferrer">
            {DATA_SOURCE_INFO.portal}
          </a>
        </p>
        <p>
          Type of data: <strong>Administrative data</strong> from the HESA Finance record (with OfS collection for relevant English providers from 2018/19).
        </p>
        <p>{DATA_SOURCE_INFO.providerScope}</p>
      </section>

      <section className="reference-grid">
        {DATA_REFERENCE_TABLES.map((table) => (
          <article className="panel reference-card" key={table.id}>
            <header>
              <h3>{table.title}</h3>
              <p>
                <strong>File:</strong> <code>{table.file}</code>
              </p>
              <p>
                <strong>Official table page:</strong>{' '}
                <a href={table.link} target="_blank" rel="noreferrer">
                  {table.link}
                </a>
              </p>
              <p>{table.purpose}</p>
            </header>

            <div className="reference-notes">
              <h4>Key HESA Notes</h4>
              <ul>
                {table.hesaNotes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>

            <div className="reference-table-wrap">
              <table className="reference-table">
                <thead>
                  <tr>
                    <th>Column</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {table.columns.map(([name, desc]) => (
                    <tr key={name}>
                      <td>
                        <code>{name}</code>
                      </td>
                      <td>{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
