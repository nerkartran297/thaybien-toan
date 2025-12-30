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

  // Calculate gold to add: if points > 0 (adding points, not subtracting), add gold = points / 2
  const goldToAdd = points > 0 ? Math.floor(points / 2) : 0;

  // Update both lifetimeScore, seasonalScores, and gold (if applicable)
  const updateData: any = {
    $inc: { 
      lifetimeScore: points,
    },
    $set: { 
      seasonalScores: updatedSeasonalScores,
      currentSeason: profile.currentSeason || 1,
      updatedAt: new Date(),
    },
  };

  // Only add gold if points were added (positive)
  if (goldToAdd > 0) {
    // Ensure gold field exists (initialize to 0 if it doesn't exist)
    if (profile.gold === undefined || profile.gold === null) {
      updateData.$set.gold = 0;
    }
    updateData.$inc.gold = goldToAdd;
  }

  const updateResult = await db.collection('student_profiles').updateOne(
    { _id: studentProfileId },
    updateData,
    { upsert: false }
  );

  if (updateResult.matchedCount === 0) {
    throw new Error(`Failed to update student profile with ID: ${studentProfileId}`);
  }
}

