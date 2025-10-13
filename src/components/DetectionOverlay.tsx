interface DetectedObject {
  class: string;
  confidence: number;
  bbox: [number, number, number, number];
  timestamp: Date;
}

interface DetectionOverlayProps {
  objects: DetectedObject[];
}

const DetectionOverlay: React.FC<DetectionOverlayProps> = ({ objects }) => {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {objects.map((obj, index) => {
        const [x, y, width, height] = obj.bbox;
        
        // Convert coordinates to percentages
        const leftPercent = (x / 640) * 100; // Assuming 640px input width
        const topPercent = (y / 640) * 100;
        const widthPercent = (width / 640) * 100;
        const heightPercent = (height / 640) * 100;
        
        // Determine color based on object class
        const getObjectColor = (className: string) => {
          switch (className.toLowerCase()) {
            case 'person':
              return 'border-red-500 bg-red-500';
            case 'car':
            case 'truck':
            case 'bus':
              return 'border-blue-500 bg-blue-500';
            case 'bicycle':
            case 'motorcycle':
              return 'border-green-500 bg-green-500';
            case 'cat':
            case 'dog':
              return 'border-yellow-500 bg-yellow-500';
            default:
              return 'border-orange-500 bg-orange-500';
          }
        };
        
        const colorClasses = getObjectColor(obj.class);
        
        return (
          <div
            key={`${obj.class}-${index}-${obj.timestamp.getTime()}`}
            className={`absolute border-2 ${colorClasses} bg-opacity-10 detection-box`}
            style={{
              left: `${leftPercent}%`,
              top: `${topPercent}%`,
              width: `${widthPercent}%`,
              height: `${heightPercent}%`,
            }}
          >
            {/* Label */}
            <div className={`absolute -top-6 left-0 px-2 py-1 text-xs font-medium text-white rounded ${colorClasses.split(' ')[1]} bg-opacity-90`}>
              {obj.class} {(obj.confidence * 100).toFixed(0)}%
            </div>
            
            {/* Confidence bar */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-black bg-opacity-50">
              <div 
                className={`h-full ${colorClasses.split(' ')[1]}`}
                style={{ width: `${obj.confidence * 100}%` }}
              />
            </div>
            
            {/* Center dot */}
            <div className={`absolute top-1/2 left-1/2 w-2 h-2 rounded-full ${colorClasses.split(' ')[1]} transform -translate-x-1/2 -translate-y-1/2`} />
          </div>
        );
      })}
      
      {/* Detection stats overlay */}
      {objects.length > 0 && (
        <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span>{objects.length} object{objects.length !== 1 ? 's' : ''} detected</span>
          </div>
          
          {/* Object breakdown */}
          <div className="mt-1 text-xs">
            {Object.entries(
              objects.reduce((acc, obj) => {
                acc[obj.class] = (acc[obj.class] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            ).map(([className, count]) => (
              <div key={className} className="text-gray-300">
                {className}: {count}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DetectionOverlay;