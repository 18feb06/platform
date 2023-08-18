import { CaretSortIcon, CheckIcon, ReloadIcon } from "@radix-ui/react-icons";
import axios from "axios";
import Link from "next/link";
import { usePostHog } from "posthog-js/react";
import { useEffect, useState } from "react";

import { Button, buttonVariants } from "./ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "./ui/command";
import { Icons } from "./ui/icons";
import { Label } from "./ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { toast } from "./ui/use-toast";
import { getAxiosErorrMessage } from "./utils";
import { cn } from "../lib/utils";

export const LeftPanel = (props: {
  className: string;
  authToken: string | null;
  githubToken: string | null;
  selectedRepoId: number | null;
  setSelectedRepoId: any;
  setRepoConnected: any;
  loadingAuth: boolean;
}) => {
  const [githubRepos, setGithubRepos] = useState<any>([]);
  const [connectedRepos, setConnectedRepos] = useState<any>([]);

  const [reposPopoverOpen, setReposPopoverOpen] = useState(false);

  const [refetchRepoListTrigger, setRefetchRepoListTrigger] = useState(1);

  const [loadingRepos, setLoadingRepos] = useState(false);

  const posthog = usePostHog();

  const connectedRepo = connectedRepos.find((repo: any) => {
    return repo.id === props.selectedRepoId;
  });
  const selectedGithubRepo = githubRepos.find((repo: any) => {
    return repo.id === props.selectedRepoId;
  });

  useEffect(() => {
    if (props.githubToken) {
      // Fetch repos
      axios
        .get("https://api.github.com/user/repos", {
          params: {
            affiliation: "owner",
            visibility: "public",
            per_page: 100,
          },
          headers: {
            Authorization: "Bearer " + props.githubToken,
          },
        })
        .then((res: any) => {
          setGithubRepos(res.data);
        })
        .catch((e) => {
          setGithubRepos([]);
          console.error(e);
          toast({
            variant: "destructive",
            title: "Could not fetch repos from Github",
            description: getAxiosErorrMessage(e).toString(),
          });
        });
      // Identify user
      axios
        .get("https://api.github.com/user", {
          headers: {
            Authorization: "Bearer " + props.githubToken,
          },
        })
        .then((res: any) => {
          posthog?.identify(res.data.id, {});
        })
        .catch((e) => {
          console.error(e);
          toast({
            variant: "destructive",
            title: `Could not fetch user from Github ${props.githubToken}`,
            description: getAxiosErorrMessage(e).toString(),
          });
        });
    }
  }, [props.githubToken]);

  useEffect(() => {
    if (props.authToken) {
      setLoadingRepos(true);
      axios
        .get(`${process.env.NEXT_PUBLIC_API_URL}/repos/`, {
          headers: {
            Authorization: "Bearer " + props.authToken,
          },
        })
        .then((res: any) => {
          setConnectedRepos(res.data);
          setLoadingRepos(false);
        })
        .catch((e) => {
          toast({
            variant: "destructive",
            title: "Could not fetch connected repos",
            description: getAxiosErorrMessage(e).toString(),
          });
          console.error(e);
          setLoadingRepos(false);
        });
    }
  }, [props.authToken, refetchRepoListTrigger]);

  return (
    <Card
      className={
        "left-panel py-4 px-4 w-[400px] shrink-0 " + props.className || ""
      }
      style={{ height: "100%" }}
    >
      <CardHeader>
        <CardTitle className="mb-4 text-lg">Authentication</CardTitle>
      </CardHeader>
      <CardContent>
        <Link
          // @ts-ignore
          className={buttonVariants("outline") + " mb-8"}
          href={
            !props.loadingAuth && !props.authToken
              ? `${process.env.NEXT_PUBLIC_API_URL}/login/authorize?scope=read:user%20user:email%20repo&redirect_uri=${process.env.NEXT_PUBLIC_REDIRECT_URI}`
              : ""
          }
        >
          {props.loadingAuth && (
            <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
          )}
          <Icons.gitHub className="mr-2 h-4 w-4" />
          {props.loadingAuth
            ? "Logging In..."
            : props.authToken
            ? "Logged In"
            : "Login with Github"}
        </Link>
        <div className="grid w-full max-w-sm items-center gap-4">
          <Label htmlFor="email-2" className="">
            Available Repos
          </Label>
          <Popover open={reposPopoverOpen} onOpenChange={setReposPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={reposPopoverOpen}
                className=" justify-between w-[320px]"
              >
                <div className="flex flex-row items-center justify-center">
                  {loadingRepos && (
                    <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {props.selectedRepoId
                    ? githubRepos.find(
                        (gRepo: any) => gRepo.id === props.selectedRepoId,
                      )?.full_name
                    : githubRepos?.length
                    ? "Select a repo"
                    : "No repos available"}
                </div>
                <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0">
              <Command>
                <CommandInput placeholder="Search repo...." className="h-9" />
                <CommandEmpty>No repo found.</CommandEmpty>
                <div className="overflow-y-scroll max-h-80">
                  <CommandGroup>
                    {githubRepos.map((repo: any) => (
                      <CommandItem
                        key={repo.id}
                        value={repo.full_name}
                        onSelect={() => {
                          props.setRepoConnected(
                            !!connectedRepos.find((r: any) => {
                              return r.id === repo.id;
                            }),
                          );
                          props.setSelectedRepoId(repo.id);
                          setReposPopoverOpen(false);
                        }}
                      >
                        {repo.full_name}
                        <CheckIcon
                          className={cn(
                            "ml-auto h-4 w-4",
                            props.selectedRepoId === repo.id
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </div>
              </Command>
            </PopoverContent>
          </Popover>
          {props.selectedRepoId && (
            <Button
              variant={"outline"}
              disabled={connectedRepo}
              onClick={() => {
                axios
                  .post(
                    `${process.env.NEXT_PUBLIC_API_URL}/repos/`,
                    {
                      id: selectedGithubRepo?.id,
                      owner_id: selectedGithubRepo?.owner?.id,
                      full_name: selectedGithubRepo?.full_name,
                    },
                    {
                      headers: {
                        Authorization: "Bearer " + props.authToken,
                      },
                    },
                  )
                  .then((res) => {
                    setRefetchRepoListTrigger(refetchRepoListTrigger + 1);
                  })
                  .catch((e) => {
                    console.error(e);
                    toast({
                      variant: "destructive",
                      title: "Could not connect repo",
                      description: getAxiosErorrMessage(e).toString(),
                    });
                  });
              }}
            >
              {connectedRepo ? "Repo Connected" : "Connect Repo"}
            </Button>
          )}
          {connectedRepo && (
            <Button
              variant="secondary"
              className="mb-8"
              onClick={() => {
                const disabled = connectedRepo.removed_at;

                axios
                  .put(
                    `${process.env.NEXT_PUBLIC_API_URL}/repos/${
                      connectedRepo.id
                    }/${disabled ? "enable" : "disable"}`,
                    {},
                    {
                      headers: {
                        Authorization: "Bearer " + props.authToken,
                      },
                    },
                  )
                  .then((res) => {
                    setRefetchRepoListTrigger(refetchRepoListTrigger + 1);
                  })
                  .catch((e) => {
                    toast({
                      variant: "destructive",
                      title: "Could not modify repo",
                      description: getAxiosErorrMessage(e).toString(),
                    });
                    console.error(e);
                  });
              }}
            >
              {connectedRepo?.removed_at ? "Enable Repo" : "Disable Repo"}
            </Button>
          )}
        </div>
      </CardContent>
      <CardFooter></CardFooter>
    </Card>
  );
};