import { Db, ObjectId } from 'mongodb';

/**
 * Helper function to add points to both lifetimeScore and current season
 * @param db - MongoDB database instance
 * @param studentProfileId - Student profile _id (not userId)
 * @param points - Points to add (can be negative to subtract)
 */
export async function addPointsToStudent(
  db: Db,
  studentProfileId: ObjectId,
  points: number
): Promise<void> {
  if (!studentProfileId) {
    throw new Error('Student profile ID is required');
  }

  // Get current profile
  const profile = await db.collection('student_profiles').findOne({
    _id: studentProfileId,
  });

  if (!profile) {
    throw new Error(`Student profile not found with ID: ${studentProfileId}`);
  }

  const seasonalScores = profile.seasonalScores || [0];
  const currentSeasonIndex = seasonalScores.length > 0 ? seasonalScores.length - 1 : 0; // Index của mùa hiện tại (phần tử cuối)

  // Ensure seasonalScores array exists and has at least one element
  const updatedSeasonalScores = seasonalScores.length > 0 
    ? [...seasonalScores] 
    : [0];

  // Add points to current season
  updatedSeasonalScores[currentSeasonIndex] = (updatedSeasonalScores[currentSeasonIndex] || 0) + points;

  // Update both lifetimeScore and seasonalScores
  const updateResult = await db.collection('student_profiles').updateOne(
    { _id: studentProfileId },
    {
      $inc: { 
        lifetimeScore: points,
      },
      $set: { 
        seasonalScores: updatedSeasonalScores,
        currentSeason: profile.currentSeason || 1,
        updatedAt: new Date(),
      },
    },
    { upsert: false }
  );

  if (updateResult.matchedCount === 0) {
    throw new Error(`Failed to update student profile with ID: ${studentProfileId}`);
  }
}

