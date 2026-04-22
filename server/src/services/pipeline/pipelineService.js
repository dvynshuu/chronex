const IngestStage = require('./ingestStage');
const NormalizeStage = require('./normalizeStage');
const OptimizeStage = require('./optimizeStage');
const ActuateStage = require('./actuateStage');
const MeasureStage = require('./measureStage');

class PipelineService {
    /**
     * Run the full coordination pipeline for a set of users or a team
     * @param {Object} context - { teamId, userIds, timeRange, organization }
     * @returns {Object} Final pipeline results
     */
    async run(context) {
        console.log(`[Pipeline] Starting run for team ${context.teamId || 'unknown'}`);
        
        try {
            // 1. Ingest
            const rawData = await IngestStage.execute(context);
            
            // 2. Normalize
            const normalizedData = await NormalizeStage.execute(rawData, context);
            
            // 3. Optimize
            const optimizedData = await OptimizeStage.execute(normalizedData, context);
            
            // 4. Actuate (Non-blocking if possible, or handled as a separate step)
            const actuationResults = await ActuateStage.execute(optimizedData, context);
            
            // 5. Measure (Initial measurement of the "Potential")
            const metrics = await MeasureStage.execute(optimizedData, context);

            return {
                timestamp: new Date(),
                data: optimizedData,
                actuation: actuationResults,
                metrics
            };
        } catch (error) {
            console.error('[Pipeline] Execution failed:', error);
            throw error;
        }
    }
}

module.exports = new PipelineService();
