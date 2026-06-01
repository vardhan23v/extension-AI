import Link from 'next/link';
import prisma from '@/lib/db';
import { Card, StarRating, Badge } from '@/components/ui';
import { getRelativeTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Reviews — TalentDash', description: 'Read real workplace reviews from tech professionals across India.' };

async function getReviews() {
  const reviews = await prisma.review.findMany({
    where: { isApproved: true },
    include: { company: { select: { name: true, slug: true } } },
    orderBy: { submittedAt: 'desc' },
    take: 50,
  });
  return reviews;
}

export default async function ReviewsPage() {
  const reviews = await getReviews();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-h1 text-heading">Company Reviews</h1>
        <p className="text-body text-muted mt-1">Real workplace reviews from tech professionals</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-5 stagger-children">
        {reviews.map((review) => (
          <Card key={review.id} hover>
            <div className="flex items-start justify-between mb-3">
              <div>
                <Link href={`/companies/${review.company.slug}`} className="text-body font-semibold text-primary hover:underline">
                  {review.company.name}
                </Link>
                {review.anonymousRole && <p className="text-caption text-muted mt-0.5">{review.anonymousRole}</p>}
              </div>
              <StarRating rating={review.rating} size="sm" />
            </div>
            <h3 className="text-h4 text-heading mb-3">{review.title}</h3>
            <div className="space-y-2 mb-4">
              <p className="text-body-sm"><span className="text-success font-semibold">Pros: </span>{review.pros}</p>
              <p className="text-body-sm"><span className="text-danger font-semibold">Cons: </span>{review.cons}</p>
            </div>
            <div className="grid grid-cols-4 gap-2 pt-3 border-t border-border">
              <MiniScore label="WLB" score={review.workLifeBalance} />
              <MiniScore label="Culture" score={review.culture} />
              <MiniScore label="Growth" score={review.growth} />
              <MiniScore label="Comp" score={review.compensation} />
            </div>
            <p className="text-caption text-muted mt-3">{getRelativeTime(new Date(review.submittedAt))}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

function MiniScore({ label, score }: { label: string; score: number }) {
  const color = score >= 4 ? 'text-success' : score >= 3 ? 'text-warning' : 'text-danger';
  return (
    <div className="text-center">
      <div className={`text-body font-bold ${color}`}>{score.toFixed(1)}</div>
      <div className="text-caption text-muted">{label}</div>
    </div>
  );
}
