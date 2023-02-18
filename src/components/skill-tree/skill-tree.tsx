import React, { useEffect, useMemo, useState } from "react";
import { useQuery, gql, TypedDocumentNode } from "@apollo/client";
import LoadingIndicator from "@components/loading-indicator";
import {
  PassiveTreeConnection,
  PassiveTreeNode,
  PassiveTreeResponse,
} from "../../__generated__/graphql";
import { MemoisedSkillTreeConnection, SkillTreeConnectionProps } from "./skill-tree-connection";
import { MemoisedSkillTreeNode, SkillTreeNodeProps } from "./skill-tree-node";
import { usePoeLeagueCtx } from "@contexts/league-context";


const passiveSkillsLayoutQuery: TypedDocumentNode<{ passiveTree: PassiveTreeResponse }> = gql`
  query PassiveTree($passiveTreeVersion: String!) {
    passiveTree(passiveTreeVersion: $passiveTreeVersion) {
      constants {
        minX
        minY
        maxX
        maxY
        skillsPerOrbit
        orbitRadii
      }
      nodeMap
      connectionMap
    }
  }`;


const defaultResponse: PassiveTreeResponse = {
  __typename: "PassiveTreeResponse",
  allConnections: [],
  allNodes: [],
  connectionMap: [],
  constants: {
    minX: 0,
    minY: 0,
    maxX: 0,
    maxY: 0,
    skillsPerOrbit: [],
    orbitRadii: []
  },
  nodeMap: []
}

function createNodeProps(treeData: PassiveTreeResponse | undefined, nodes: Set<string>): Array<SkillTreeNodeProps> {
  if(treeData){
    return Object.values<PassiveTreeNode>(treeData.nodeMap).map((node) =>
    ({
      fillColor: nodes.has(node.hash) ? "red" : "black",
      x: node.x,
      y: node.y,
      size: node.size,
      hash: node.hash,
      tooltip: node.stats.reduce((tip,line)=>`${tip}\n${line}`,"") || ""
    }));
  }
  return [];
}

function createConnectionProps(treeData: PassiveTreeResponse | undefined, nodes: Set<string>): Array<SkillTreeConnectionProps> {
  if(treeData){
    return treeData.connectionMap.map((connection: PassiveTreeConnection) => {
      const fromNode = treeData.nodeMap[connection.fromNode];
      const toNode = treeData.nodeMap[connection.toNode];
      const skillsInOrbit = treeData.constants.skillsPerOrbit[fromNode.orbit!];
      const radius = treeData.constants.orbitRadii[fromNode.orbit!];
      const sweep = (toNode.orbitIndex! - fromNode.orbitIndex! > skillsInOrbit / 2)? 0 : 1;
      const strokeColor = nodes.has(fromNode.hash) && nodes.has(toNode.hash)? "red" : "black";

      return {
        fromX: fromNode.x,
        fromY: fromNode.y,
        toX: toNode.x,
        toY: toNode.y,
        orbit: {
          radius: radius,
          fromIndex: fromNode.orbitIndex,
          toIndex: toNode.orbitIndex
        },
        skillsInOrbit: skillsInOrbit,
        sweep: sweep,
        strokeColor: strokeColor,
        from: fromNode.hash,
        to: toNode.hash,
        curved: connection.curved  
      }
    });
  }
  else { return []; }
}

export default function SkillTree({ selectedNodes, version }: {
  selectedNodes?: Array<number>,
  version: string
}) {
  const { league } = usePoeLeagueCtx();
  
  const [treeData, setTreeData] = useState<PassiveTreeResponse>();
  
  const { refetch, loading } = useQuery(
    passiveSkillsLayoutQuery,
    {
        skip: true,
        variables: { 
        passiveTreeVersion: version,
        league: league
      },
      onCompleted({ passiveTree }) {
        setTreeData(passiveTree);
        if (passiveTree) {
          localStorage.setItem(
            `${version}_passive_tree_data`,
            JSON.stringify(passiveTree)
          );
        }
      }
  }); 

  useEffect(() => {
    if (typeof window !== 'undefined' && !treeData) {
      const localData = localStorage.getItem(`${version}_passive_tree_data`);
      if (localData) {
        setTreeData(JSON.parse(localData));
      } else {
        refetch();
      }
    }
  }, [treeData, refetch, version]);    
  
  const memoizedSelectedNodes = useMemo(
    () => new Set<string>(selectedNodes ? selectedNodes.map(num=>num.toString()) : []), 
    [selectedNodes]);

  const memoizedNodeProps = useMemo(
    ()=>createNodeProps(treeData, memoizedSelectedNodes),
    [treeData, memoizedSelectedNodes]);

  const memoizedConnectionProps = useMemo(
    ()=>createConnectionProps(treeData, memoizedSelectedNodes),
    [treeData, memoizedSelectedNodes]
  );
  
  const minX = treeData?.constants.minX || 0;
  const minY = treeData?.constants.minY || 0;
  const maxX = treeData?.constants.maxX || 0;
  const maxY = treeData?.constants.maxY || 0;
  const treeWidth = maxX - minX;
  const treeHeight = maxY - minY;

  return (
    <>{
      loading?
        <LoadingIndicator/> 
        :
        <svg
          width="100%"
          preserveAspectRatio="xMidYMid meet"
          viewBox={`${minX} ${minY} ${treeWidth} ${treeHeight}`}
        >
          {
            memoizedConnectionProps.map((props, index)=>
              <MemoisedSkillTreeConnection key={index} {...props}/>)
          }
          {
            memoizedNodeProps.map((props, index) => (
              <MemoisedSkillTreeNode key={index} {...props}/>))
          }
        </svg>
    }</>
  );
}
