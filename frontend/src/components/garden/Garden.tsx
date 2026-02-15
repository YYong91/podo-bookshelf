import type { GardenStats } from "../../types";
import Bunch from "./Bunch";
import Tree from "./Tree";

interface GardenProps {
  stats: GardenStats;
}

export default function Garden({ stats }: GardenProps) {
  return (
    <div className="rounded-2xl bg-white/80 p-6 shadow-sm">
      <div className="mb-4 text-center">
        <h2 className="text-lg font-bold text-grape-700">🌿 포도정원 🌿</h2>
        <p className="mt-1 text-sm text-warm-500">
          총 <span className="font-bold text-grape-600">{stats.total_reviews}권</span> 읽었어요!
        </p>
      </div>

      {stats.trees > 0 && (
        <div className="mb-6">
          <p className="mb-2 text-center text-xs font-medium text-leaf-600">
            🌳 포도나무 {stats.trees}그루
          </p>
          <div className="flex justify-center gap-4">
            {Array.from({ length: stats.trees }).map((_, i) => (
              <div key={i} className="h-32 w-20">
                <Tree bunchCount={10} />
              </div>
            ))}
          </div>
        </div>
      )}

      {(stats.bunches > 0 || stats.grapes > 0) && (
        <div className="flex flex-col items-center gap-4">
          {stats.bunches > 0 && (
            <div>
              <p className="mb-2 text-center text-xs font-medium text-grape-500">
                🍇 완성된 송이 {stats.bunches}개
              </p>
              <div className="flex justify-center gap-3">
                {Array.from({ length: stats.bunches }).map((_, i) => (
                  <div key={i} className="h-24 w-12">
                    <Bunch filledCount={10} complete />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="mb-2 text-center text-xs font-medium text-warm-500">
              지금 자라는 송이 {stats.grapes}/10
            </p>
            <div className="mx-auto h-40 w-24">
              <Bunch filledCount={stats.grapes} />
            </div>
          </div>
        </div>
      )}

      {stats.total_reviews === 0 && (
        <div className="py-8 text-center">
          <div className="mx-auto h-40 w-24 opacity-40">
            <Bunch filledCount={0} />
          </div>
          <p className="mt-4 text-sm text-warm-500">
            첫 번째 책을 읽고 포도알을 심어보세요! 🍇
          </p>
        </div>
      )}
    </div>
  );
}
