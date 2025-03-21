import { useState, useEffect } from "react";
import { Shield } from "lucide-react";
import { ApiConfig } from "@/lib/types";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

interface ApiConfigProps {
  config: ApiConfig;
  onConfigChange: (config: ApiConfig) => void;
}

export default function ApiConfigPanel({ config, onConfigChange }: ApiConfigProps) {
  const [temperature, setTemperature] = useState(config.temperature);
  const [model, setModel] = useState(config.model);

  // Update parent component when config changes
  useEffect(() => {
    onConfigChange({
      model,
      temperature
    });
  }, [model, temperature, onConfigChange]);

  // Handle temperature slider change
  const handleTemperatureChange = (value: number[]) => {
    setTemperature(value[0]);
  };

  // Handle model selection change
  const handleModelChange = (value: string) => {
    setModel(value as "gemini-2.0-flash" | "gemini-1.5-pro");
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-medium mb-4 text-gray-800">Gemini API Configuration</h2>
      
      <div className="flex items-start gap-4 flex-col md:flex-row">
        <div className="w-full md:w-2/3">
          <div className="mb-4">
            <label htmlFor="model-selection" className="block text-sm font-medium text-gray-700 mb-1">Model</label>
            <Select value={model} onValueChange={handleModelChange}>
              <SelectTrigger id="model-selection" className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
                <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="mb-2">
            <div className="flex justify-between">
              <label htmlFor="temperature-slider" className="block text-sm font-medium text-gray-700 mb-1">
                Temperature: <span id="temperature-value">{temperature.toFixed(1)}</span>
              </label>
            </div>
            <Slider
              id="temperature-slider"
              min={0}
              max={1}
              step={0.1}
              value={[temperature]}
              onValueChange={handleTemperatureChange}
              className="w-full h-2"
            />
          </div>
        </div>
        
        <div className="w-full md:w-1/3">
          <span className="block text-sm font-medium text-gray-700 mb-1">Security Status</span>
          <div className="flex items-center p-3 bg-green-100 text-green-800 rounded-md">
            <Shield className="h-5 w-5 mr-2" />
            <div>
              <p className="text-sm font-medium">API Key Protected</p>
              <p className="text-xs">Using environment variables</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
