import { useQuery } from "@tanstack/react-query";
import { coreAPI } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  GraduationCap, 
  Heart, 
  Building, 
  Users, 
  TrendingUp, 
  MapPin,
  Star,
  Calendar,
  Target,
  BarChart3,
  PieChart
} from "lucide-react";

interface Project {
  id: number;
  name: string;
  description?: string;
  status: string;
  budget: number;
  spent: number;
  department?: {
    id: number;
    name: string;
  };
  expected_beneficiaries?: number;
}

export function ImpactVisualization() {
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const response = await coreAPI.getProjects();
      return response.data.results;
    },
  });

  const { data: impactMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["/api/impact-metrics"],
    queryFn: async () => {
      const response = await coreAPI.getImpactMetrics();
      return response.data.results;
    },
  });

  // Calculate impact summaries by department
  const calculateImpactSummary = () => {
    if (!projects) return { education: {}, healthcare: {}, infrastructure: {} };

    const educationProjects = projects.filter((p: Project) => 
      p.department?.name?.toLowerCase().includes('education') || 
      p.description?.toLowerCase().includes('education') ||
      p.name.toLowerCase().includes('classroom') ||
      p.name.toLowerCase().includes('school')
    );

    const healthcareProjects = projects.filter((p: Project) => 
      p.department?.name?.toLowerCase().includes('health') ||
      p.description?.toLowerCase().includes('health') ||
      p.name.toLowerCase().includes('medical') ||
      p.name.toLowerCase().includes('hospital')
    );

    const infrastructureProjects = projects.filter((p: Project) => 
      p.department?.name?.toLowerCase().includes('infrastructure') ||
      p.description?.toLowerCase().includes('road') ||
      p.name.toLowerCase().includes('infrastructure') ||
      p.name.toLowerCase().includes('maintenance')
    );

    return {
      education: {
        projects: educationProjects.length,
        budget: educationProjects.reduce((sum: number, p: Project) => sum + p.budget, 0),
        utilized: educationProjects.reduce((sum: number, p: Project) => sum + p.spent, 0),
        beneficiaries: educationProjects.reduce((sum: number, p: Project) => sum + (p.expected_beneficiaries || 0), 0),
        completed: educationProjects.filter((p: Project) => p.status === 'completed').length
      },
      healthcare: {
        projects: healthcareProjects.length,
        budget: healthcareProjects.reduce((sum: number, p: Project) => sum + p.budget, 0),
        utilized: healthcareProjects.reduce((sum: number, p: Project) => sum + p.spent, 0),
        beneficiaries: healthcareProjects.reduce((sum: number, p: Project) => sum + (p.expected_beneficiaries || 0), 0),
        completed: healthcareProjects.filter((p: Project) => p.status === 'completed').length
      },
      infrastructure: {
        projects: infrastructureProjects.length,
        budget: infrastructureProjects.reduce((sum: number, p: Project) => sum + p.budget, 0),
        utilized: infrastructureProjects.reduce((sum: number, p: Project) => sum + p.spent, 0),
        beneficiaries: infrastructureProjects.reduce((sum: number, p: Project) => sum + (p.expected_beneficiaries || 0), 0),
        completed: infrastructureProjects.filter((p: Project) => p.status === 'completed').length
      }
    };
  };

  const impactSummary = calculateImpactSummary();

  const impactStories = [
    {
      id: "education-1",
      title: "Smart Classrooms Transforming Education",
      description: "8 new smart classrooms equipped with digital boards and modern facilities are now serving 600 students daily, improving learning outcomes by 35%.",
      investment: 4500000,
      beneficiaries: 600,
      score: 4.8,
      image: "education",
      category: "education"
    },
    {
      id: "healthcare-1", 
      title: "Advanced Healthcare Access",
      description: "New diagnostic equipment including X-ray and ultrasound machines now serve 5,000+ patients annually, reducing referral times by 60%.",
      investment: 2850000,
      beneficiaries: 5000,
      score: 4.3,
      image: "healthcare",
      category: "healthcare"
    },
    {
      id: "infrastructure-1",
      title: "Improved Connectivity",
      description: "5km of road maintenance and improvement project now serves 10,000+ daily commuters, reducing travel time by 40%.",
      investment: 1575000,
      beneficiaries: 10000,
      score: 4.6,
      image: "infrastructure", 
      category: "infrastructure"
    }
  ];

  return (
    <div className="space-y-8" data-testid="impact-visualization-container">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">Impact Visualization</h2>
        <p className="text-muted-foreground">See how budget allocations translate into real-world outcomes and beneficiaries</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Impact Summary Cards */}
        <div className="space-y-6">
          {/* Education Impact */}
          <Card className="shadow-sm" data-testid="card-education-impact">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Education Impact</h3>
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-blue-500" />
                </div>
              </div>
              
              {projectsLoading ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-2xl font-bold text-foreground" data-testid="education-projects-count">
                        {impactSummary.education.projects || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Projects</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground" data-testid="education-beneficiaries">
                        {(impactSummary.education.beneficiaries || 0).toLocaleString('en-IN')}
                      </div>
                      <div className="text-sm text-muted-foreground">Students Benefited</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Budget Utilized</span>
                      <span className="font-medium text-foreground">
                        ₹{((impactSummary.education.utilized || 0) / 100000).toFixed(0)}L / ₹{((impactSummary.education.budget || 0) / 100000).toFixed(0)}L
                      </span>
                    </div>
                    <Progress 
                      value={impactSummary.education.budget > 0 ? (impactSummary.education.utilized / impactSummary.education.budget) * 100 : 0} 
                      className="h-2"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Healthcare Impact */}
          <Card className="shadow-sm" data-testid="card-healthcare-impact">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Healthcare Impact</h3>
                <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                  <Heart className="w-5 h-5 text-red-500" />
                </div>
              </div>
              
              {projectsLoading ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-2xl font-bold text-foreground" data-testid="healthcare-projects-count">
                        {impactSummary.healthcare.projects || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Projects</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground" data-testid="healthcare-beneficiaries">
                        {(impactSummary.healthcare.beneficiaries || 0).toLocaleString('en-IN')}
                      </div>
                      <div className="text-sm text-muted-foreground">Patients/Year</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Budget Utilized</span>
                      <span className="font-medium text-foreground">
                        ₹{((impactSummary.healthcare.utilized || 0) / 100000).toFixed(0)}L / ₹{((impactSummary.healthcare.budget || 0) / 100000).toFixed(0)}L
                      </span>
                    </div>
                    <Progress 
                      value={impactSummary.healthcare.budget > 0 ? (impactSummary.healthcare.utilized / impactSummary.healthcare.budget) * 100 : 0} 
                      className="h-2 [&>div]:bg-red-500"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Infrastructure Impact */}
          <Card className="shadow-sm" data-testid="card-infrastructure-impact">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Infrastructure Impact</h3>
                <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <Building className="w-5 h-5 text-green-500" />
                </div>
              </div>
              
              {projectsLoading ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-2xl font-bold text-foreground" data-testid="infrastructure-projects-count">
                        {impactSummary.infrastructure.projects || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Projects</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground" data-testid="infrastructure-beneficiaries">
                        {(impactSummary.infrastructure.beneficiaries || 0).toLocaleString('en-IN')}
                      </div>
                      <div className="text-sm text-muted-foreground">Daily Users</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Budget Utilized</span>
                      <span className="font-medium text-foreground">
                        ₹{((impactSummary.infrastructure.utilized || 0) / 100000).toFixed(0)}L / ₹{((impactSummary.infrastructure.budget || 0) / 100000).toFixed(0)}L
                      </span>
                    </div>
                    <Progress 
                      value={impactSummary.infrastructure.budget > 0 ? (impactSummary.infrastructure.utilized / impactSummary.infrastructure.budget) * 100 : 0} 
                      className="h-2 [&>div]:bg-green-500"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Impact Timeline & Map */}
        <div className="space-y-6">
          <Card className="shadow-sm" data-testid="card-impact-timeline">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span>Monthly Impact Progress</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Chart Container */}
              <div className="relative bg-gradient-to-r from-muted/30 to-background rounded-lg p-6 h-64">
                <div className="flex items-end justify-between h-full">
                  <div className="flex flex-col items-center">
                    <div className="w-8 bg-blue-500 rounded-t" style={{ height: "60%" }}></div>
                    <span className="text-xs text-muted-foreground mt-2">Jan</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-8 bg-blue-500 rounded-t" style={{ height: "75%" }}></div>
                    <span className="text-xs text-muted-foreground mt-2">Feb</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-8 bg-blue-500 rounded-t" style={{ height: "85%" }}></div>
                    <span className="text-xs text-muted-foreground mt-2">Mar</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-8 bg-blue-500 rounded-t" style={{ height: "90%" }}></div>
                    <span className="text-xs text-muted-foreground mt-2">Apr</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-8 bg-blue-500 rounded-t" style={{ height: "95%" }}></div>
                    <span className="text-xs text-muted-foreground mt-2">May</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-8 bg-primary rounded-t" style={{ height: "100%" }}></div>
                    <span className="text-xs text-muted-foreground mt-2">Jun</span>
                  </div>
                </div>
                
                <div className="absolute top-4 left-4 text-sm text-muted-foreground">
                  Beneficiaries Reached (Thousands)
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm" data-testid="card-impact-distribution">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="w-5 h-5" />
                <span>Geographic Impact Distribution</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Map Placeholder */}
              <div className="relative bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg p-6 h-64 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-primary mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Interactive impact map showing project locations and beneficiary coverage</p>
                </div>
                
                {/* Sample impact indicators */}
                <div className="absolute top-6 left-6 w-3 h-3 bg-verified rounded-full pulse-slow"></div>
                <div className="absolute top-12 right-12 w-3 h-3 bg-primary rounded-full pulse-slow"></div>
                <div className="absolute bottom-8 left-1/3 w-3 h-3 bg-accent rounded-full pulse-slow"></div>
                <div className="absolute bottom-12 right-8 w-3 h-3 bg-verified rounded-full pulse-slow"></div>
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-verified rounded-full mr-2"></span>
                  <span className="text-muted-foreground">Completed Projects</span>
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-primary rounded-full mr-2"></span>
                  <span className="text-muted-foreground">Active Projects</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Detailed Impact Stories */}
      <div className="mt-8">
        <h3 className="text-xl font-bold text-foreground mb-6">Impact Stories</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {impactStories.map((story) => (
            <Card key={story.id} className="shadow-sm overflow-hidden" data-testid={`impact-story-${story.id}`}>
              {/* Mock image representation */}
              <div className={`w-full h-48 flex items-center justify-center ${
                story.category === 'education' ? 'bg-blue-500/10' :
                story.category === 'healthcare' ? 'bg-red-500/10' :
                'bg-green-500/10'
              }`}>
                <div className="text-center">
                  {story.category === 'education' && <GraduationCap className="w-12 h-12 text-blue-500 mx-auto mb-2" />}
                  {story.category === 'healthcare' && <Heart className="w-12 h-12 text-red-500 mx-auto mb-2" />}
                  {story.category === 'infrastructure' && <Building className="w-12 h-12 text-green-500 mx-auto mb-2" />}
                  <p className="text-sm text-muted-foreground capitalize">{story.category} Impact</p>
                </div>
              </div>
              
              <CardContent className="p-6">
                <h4 className="font-semibold text-foreground mb-2" data-testid={`story-title-${story.id}`}>
                  {story.title}
                </h4>
                <p className="text-sm text-muted-foreground mb-4" data-testid={`story-description-${story.id}`}>
                  {story.description}
                </p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Investment</span>
                    <span className="font-medium text-primary" data-testid={`story-investment-${story.id}`}>
                      ₹{(story.investment / 100000).toFixed(0)}L
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Direct Beneficiaries</span>
                    <span className="font-medium text-foreground" data-testid={`story-beneficiaries-${story.id}`}>
                      {story.beneficiaries.toLocaleString('en-IN')} {story.category === 'education' ? 'students' : story.category === 'healthcare' ? 'patients/year' : 'daily users'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Impact Score</span>
                    <div className="flex items-center">
                      <div className="flex text-yellow-400 mr-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-3 h-3 ${i < Math.floor(story.score) ? 'fill-current' : ''}`} 
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium" data-testid={`story-score-${story.id}`}>
                        {story.score}/5
                      </span>
                    </div>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full text-sm hover:bg-primary/5 transition-colors"
                  data-testid={`button-view-story-${story.id}`}
                >
                  View Full Story
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
