import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from "react-beautiful-dnd";
import { JobApplication, supabase } from "../lib/supabase";
import { useAuth } from "../stores/auth";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { downloadApplicationPDF } from "../lib/pdf";
import { trackEvent } from "../lib/monitoring";
import {
  CalendarIcon,
  DocumentArrowDownIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { JobApplicationForm } from "./JobApplicationForm";
import { AutomatedApplications } from "./applications/AutomatedApplications";
import { CoverLetterGenerator } from "./applications/CoverLetterGenerator";
import { InterviewManager } from "./applications/InterviewManager";

const statusColumns = [
  { id: "draft", name: "Brouillons", color: "bg-gray-600" },
  { id: "on_hold", name: "En veille", color: "bg-purple-600" },
  { id: "applied", name: "Postulées", color: "bg-blue-600" },
  { id: "interviewing", name: "Entretiens", color: "bg-yellow-600" },
  { id: "offer", name: "Offres", color: "bg-green-600" },
  { id: "rejected", name: "Refusées", color: "bg-red-600" },
];

function JobApplications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<
    JobApplication | null
  >(null);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState<
    "kanban" | "automated" | "cover-letter" | "interviews"
  >("kanban");

  useEffect(() => {
    if (user) {
      loadApplications();
    }
  }, [user]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("job_applications")
        .select(`
          *,
          jobs (*)
        `)
        .eq("user_id", user?.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      const formattedData = data?.map((app) => ({ ...app, job: app.jobs })) ||
        [];
      setApplications(formattedData as JobApplication[]);
    } catch (error) {
      console.error("Error loading applications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    const newStatus = destination.droppableId as JobApplication["status"];

    try {
      const { error } = await supabase
        .from("job_applications")
        .update({
          status: newStatus,
          applied_at: newStatus === "applied" ? new Date().toISOString() : null,
        })
        .eq("id", draggableId);

      if (error) throw error;

      setApplications((prev) =>
        prev.map((app) =>
          app.id === draggableId
            ? {
              ...app,
              status: newStatus,
              applied_at: newStatus === "applied"
                ? new Date().toISOString()
                : null,
            }
            : app
        )
      );
    } catch (error) {
      console.error("Error updating application status:", error);
    }
  };

  const updateNotes = async () => {
    if (!selectedApplication) return;

    try {
      const { error } = await supabase
        .from("job_applications")
        .update({ notes })
        .eq("id", selectedApplication.id);

      if (error) throw error;

      setApplications((prev) =>
        prev.map((app) =>
          app.id === selectedApplication.id ? { ...app, notes } : app
        )
      );
      setShowNotes(false);
    } catch (error) {
      console.error("Error updating notes:", error);
    }
  };

  const deleteApplication = async (id: string) => {
    if (
      !window.confirm("Êtes-vous sûr de vouloir supprimer cette candidature ?")
    ) return;

    try {
      const { error } = await supabase.from("job_applications").delete().eq(
        "id",
        id,
      );
      if (error) throw error;
      setApplications((prev) => prev.filter((app) => app.id !== id));
      trackEvent("application_deleted", {
        user_id: user?.id,
        application_id: id,
      });
    } catch (error) {
      console.error("Error deleting application:", error);
    }
  };

  const handleExportPDF = async (application: JobApplication) => {
    if (!application.job) return;
    try {
      trackEvent("pdf_export_started", {
        user_id: user?.id,
        application_id: application.id,
      });
      await downloadApplicationPDF(application);
      trackEvent("pdf_export_success", {
        user_id: user?.id,
        application_id: application.id,
      });
    } catch (error) {
      console.error("Error exporting application to PDF:", error);
      trackEvent("pdf_export_failed", {
        user_id: user?.id,
        application_id: application.id,
        error: (error as Error).message,
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">
          Suivi de mes candidatures
        </h1>
        <button
          onClick={() => {
            setSelectedJobId(undefined);
            setShowForm(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Ajouter une candidature
        </button>
      </div>

      <div className="bg-background-secondary p-4 rounded-lg">
        <div className="mb-6">
          <div className="border-b border-gray-700">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab("kanban")}
                className={`${
                  activeTab === "kanban"
                    ? "border-primary-500 text-primary-400"
                    : "border-transparent text-gray-400 hover:text-white hover:border-gray-500"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Kanban
              </button>
              <button
                onClick={() => setActiveTab("automated")}
                className={`${
                  activeTab === "automated"
                    ? "border-primary-500 text-primary-400"
                    : "border-transparent text-gray-400 hover:text-white hover:border-gray-500"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Candidatures Automatisées
              </button>
              <button
                onClick={() => setActiveTab("cover-letter")}
                className={`${
                  activeTab === "cover-letter"
                    ? "border-primary-500 text-primary-400"
                    : "border-transparent text-gray-400 hover:text-white hover:border-gray-500"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Générateur de Lettres
              </button>
              <button
                onClick={() => setActiveTab("interviews")}
                className={`${
                  activeTab === "interviews"
                    ? "border-primary-500 text-primary-400"
                    : "border-transparent text-gray-400 hover:text-white hover:border-gray-500"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Gestion des Entretiens
              </button>
            </nav>
          </div>
        </div>

        {loading && <p>Chargement des candidatures...</p>}

        {activeTab === "kanban" && (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {statusColumns.map((column) => (
                <div key={column.id} className="bg-gray-900/50 rounded-lg">
                  <h2
                    className={`text-lg font-semibold p-4 border-b border-gray-700 ${column.color} text-white rounded-t-lg`}
                  >
                    {column.name}
                  </h2>
                  <Droppable droppableId={column.id}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="p-4 space-y-4 h-full"
                      >
                        {applications
                          .filter((app) => app.status === column.id && app.job)
                          .map((application, index) => (
                            <Draggable
                              key={application.id}
                              draggableId={application.id}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`bg-background p-3 rounded-lg mb-3 shadow-lg border-l-4 ${
                                    snapshot.isDragging
                                      ? "shadow-primary-500/50"
                                      : ""
                                  }`}
                                  style={{
                                    ...provided.draggableProps.style,
                                    borderColor: column.color.replace(
                                      "bg-",
                                      "",
                                    ),
                                  }}
                                >
                                  <motion.div layout>
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <div className="font-bold text-white mb-1">
                                          {application.job!.title}
                                        </div>
                                        <p className="text-sm text-gray-400">
                                          {application.job!.company}
                                        </p>
                                        {/* Badges */}
                                        <div className="flex flex-wrap gap-1 mt-2">
                                          {/* Badge Auto-apply */}
                                          {(application as any).is_auto && (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-300">
                                              🤖 Auto
                                            </span>
                                          )}
                                          {/* Indicateur de relance */}
                                          {application.applied_at &&
                                            application.status === "applied" &&
                                            Math.floor(
                                                (Date.now() -
                                                  new Date(
                                                    application.applied_at,
                                                  ).getTime()) /
                                                  (1000 * 60 * 60 * 24),
                                              ) > 7 &&
                                            (
                                              <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300">
                                                ⚠️ Relancer ({Math.floor(
                                                  (Date.now() -
                                                    new Date(
                                                      application.applied_at,
                                                    ).getTime()) /
                                                    (1000 * 60 * 60 * 24),
                                                )}j)
                                              </span>
                                            )}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() =>
                                            handleExportPDF(application)}
                                          className="text-gray-400 hover:text-white"
                                          title="Exporter en PDF"
                                        >
                                          <DocumentArrowDownIcon className="h-5 w-5" />
                                        </button>
                                        <button
                                          onClick={() => {
                                            setSelectedApplication(application);
                                            setNotes(application.notes || "");
                                            setShowNotes(true);
                                          }}
                                          className="text-gray-400 hover:text-white"
                                        >
                                          <PencilIcon className="h-4 w-4" />
                                        </button>
                                        <button
                                          onClick={() =>
                                            deleteApplication(application.id)}
                                          className="text-gray-400 hover:text-red-400"
                                        >
                                          <TrashIcon className="h-4 w-4" />
                                        </button>
                                      </div>
                                    </div>

                                    {application.next_step_date && (
                                      <div className="flex items-center gap-2 text-sm text-primary-400">
                                        <CalendarIcon className="h-4 w-4" />
                                        <span>
                                          {format(
                                            new Date(
                                              application.next_step_date,
                                            ),
                                            "dd MMMM yyyy",
                                            { locale: fr },
                                          )}
                                          {application.next_step_type &&
                                            ` - ${application.next_step_type}`}
                                        </span>
                                      </div>
                                    )}

                                    {application.notes && (
                                      <p className="text-sm text-gray-400 line-clamp-2">
                                        {application.notes}
                                      </p>
                                    )}

                                    <div className="text-xs text-gray-500">
                                      Mise à jour {format(
                                        new Date(application.updated_at),
                                        "dd/MM/yyyy",
                                        { locale: fr },
                                      )}
                                    </div>
                                  </motion.div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
            </div>
          </DragDropContext>
        )}

        {activeTab === "automated" && <AutomatedApplications />}

        {activeTab === "cover-letter" && <CoverLetterGenerator />}

        {activeTab === "interviews" && <InterviewManager />}

        {showNotes && selectedApplication && selectedApplication.job && (
          <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4">
            <div className="bg-background rounded-lg p-6 w-full max-w-lg">
              <h3 className="text-lg font-medium text-white mb-4">
                Notes - {selectedApplication.job.title}
              </h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full h-40 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Ajoutez vos notes ici..."
              />
              <div className="flex justify-end gap-4 mt-4">
                <button
                  onClick={() => setShowNotes(false)}
                  className="btn-secondary"
                >
                  Annuler
                </button>
                <button
                  onClick={updateNotes}
                  className="btn-primary"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        )}

        <JobApplicationForm
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          onSubmit={loadApplications}
          jobId={selectedJobId}
        />
      </div>
    </div>
  );
}

export default JobApplications;
