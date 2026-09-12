import React from 'react';
import { ToolDef } from '../../types';
import { ImageMergeView } from './ImageMergeView';
import { ImageExifInspectorView } from './ImageExifInspectorView';
import { ImageDiffView } from './ImageDiffView';
import { ConvertersView } from './ConvertersView';
import { EncodersView } from './EncodersView';
import { ImageTargetCompressorView } from './ImageTargetCompressorView';

interface ImageToolsViewProps {
  tool: ToolDef;
  onBackToHome?: () => void;
  onSelectRelated?: (t: ToolDef) => void;
  initialInput?: string;
}

export const ImageToolsView: React.FC<ImageToolsViewProps> = (props) => {
  const { tool } = props;

  switch (tool.id) {
    case 'image-target-compressor':
    case 'image-resizer-target-size':
      return <ImageTargetCompressorView {...props} />;
    case 'image-merger':
      return <ImageMergeView {...props} />;
    case 'image-exif-inspector':
      return <ImageExifInspectorView {...props} />;
    case 'image-diff-checker':
      return <ImageDiffView {...props} />;
    case 'base64-image':
      return <EncodersView {...props} />;
    case 'image-resizer':
    case 'favicon-generator':
    default:
      return <ConvertersView {...props} />;
  }
};
