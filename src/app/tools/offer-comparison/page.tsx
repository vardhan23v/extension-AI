'use client';

import React from 'react';
import { Card, Input } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';

interface Offer {
  name: string;
  base: number;
  bonus: number;
  stock: number;
}

export default function OfferComparisonPage() {
  const [offers, setOffers] = React.useState<Offer[]>([
    { name: 'Offer A', base: 2500000, bonus: 300000, stock: 500000 },
    { name: 'Offer B', base: 2200000, bonus: 500000, stock: 1000000 },
  ]);

  const update = (idx: number, field: keyof Offer, value: string | number) => {
    const next = [...offers];
    next[idx] = { ...next[idx], [field]: value };
    setOffers(next);
  };

  const addOffer = () => {
    if (offers.length < 4) setOffers([...offers, { name: `Offer ${String.fromCharCode(65 + offers.length)}`, base: 0, bonus: 0, stock: 0 }]);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <h1 className="text-h1 text-heading mb-2">Offer Comparison</h1>
      <p className="text-body text-muted mb-8">Compare job offers side-by-side</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {offers.map((offer, idx) => {
          const tc = offer.base + offer.bonus + offer.stock;
          const best = Math.max(...offers.map(o => o.base + o.bonus + o.stock));
          const isBest = tc === best && offers.length > 1;
          return (
            <Card key={idx} className={isBest ? 'ring-2 ring-primary' : ''}>
              {isBest && <span className="text-xs font-bold text-primary mb-2 block">🏆 BEST OFFER</span>}
              <Input label="Offer Name" value={offer.name} onChange={e => update(idx, 'name', e.target.value)} className="mb-3" />
              <Input label="Base Salary (₹)" type="number" value={offer.base} onChange={e => update(idx, 'base', Number(e.target.value))} min={0} />
              <Input label="Bonus (₹)" type="number" value={offer.bonus} onChange={e => update(idx, 'bonus', Number(e.target.value))} min={0} className="mt-3" />
              <Input label="Stock/ESOP (₹)" type="number" value={offer.stock} onChange={e => update(idx, 'stock', Number(e.target.value))} min={0} className="mt-3" />
              <div className="mt-4 pt-4 border-t border-border">
                <div className="text-caption text-muted">Total Compensation</div>
                <div className="text-h3 text-primary font-bold">{formatCurrency(tc)}</div>
                <div className="text-caption text-muted mt-1">Monthly: {formatCurrency(Math.round(tc / 12))}</div>
              </div>
            </Card>
          );
        })}
      </div>

      {offers.length < 4 && (
        <button onClick={addOffer} className="w-full py-4 border-2 border-dashed border-border rounded-xl text-body text-muted hover:border-primary hover:text-primary transition-colors">
          + Add Another Offer
        </button>
      )}
    </div>
  );
}
