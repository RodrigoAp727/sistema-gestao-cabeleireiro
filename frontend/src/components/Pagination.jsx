import React from 'react';

export default function Pagination({ page, totalPages, totalItems, pageSize, onPageChange, itemLabel = 'itens' }) {
  if (totalPages <= 1) {
    return null;
  }

  const inicio = totalItems === 0 ? 0 : ((page - 1) * pageSize) + 1;
  const fim = Math.min(page * pageSize, totalItems);

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-xl border border-slate-300/10 bg-slate-950/25 px-4 py-3 text-sm text-slate-300 sm:flex-row sm:items-center sm:justify-between">
      <p>
        Exibindo {inicio}-{fim} de {totalItems} {itemLabel}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="ui-button ui-button-ghost px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          Anterior
        </button>
        <span className="min-w-[72px] text-center text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          className="ui-button ui-button-ghost px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Próxima
        </button>
      </div>
    </div>
  );
}