import React from 'react';

import {
  ActionGroup,
  Button,
  Modal,
  ModalVariant,
} from '@patternfly/react-core';

import {
  selectBlueprintSearchInput,
  selectLimit,
  selectOffset,
  selectSelectedBlueprintId,
  setBlueprintId,
  setBlueprintsOffset,
} from '../../store/BlueprintSlice';
import { imageBuilderApi } from '../../store/enhancedImageBuilderApi';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  useDeleteBlueprintMutation,
  useGetBlueprintsQuery,
} from '../../store/imageBuilderApi';

interface DeleteBlueprintModalProps {
  setShowDeleteModal: React.Dispatch<React.SetStateAction<boolean>>;
  isOpen: boolean;
}

export const DeleteBlueprintModal: React.FunctionComponent<
  DeleteBlueprintModalProps
> = ({ setShowDeleteModal, isOpen }: DeleteBlueprintModalProps) => {
  const selectedBlueprintId = useAppSelector(selectSelectedBlueprintId);
  const blueprintSearchInput = useAppSelector(selectBlueprintSearchInput);
  const blueprintsOffset = useAppSelector(selectOffset);
  const blueprintsLimit = useAppSelector(selectLimit);
  const dispatch = useAppDispatch();
  const { blueprintName } = useGetBlueprintsQuery(
    {
      search: blueprintSearchInput,
      limit: blueprintsLimit,
      offset: blueprintsOffset,
    },
    {
      selectFromResult: ({ data }) => ({
        blueprintName: data?.data?.find(
          (blueprint: { id: string | undefined }) =>
            blueprint.id === selectedBlueprintId
        )?.name,
      }),
    }
  );
  const [deleteBlueprint] = useDeleteBlueprintMutation({
    fixedCacheKey: 'delete-blueprint',
  });
  const handleDelete = async () => {
    if (selectedBlueprintId) {
      setShowDeleteModal(false);
      await deleteBlueprint({ id: selectedBlueprintId });
      dispatch(setBlueprintsOffset(0));
      dispatch(setBlueprintId(undefined));
      dispatch(imageBuilderApi.util.invalidateTags([{ type: 'Blueprints' }]));
    }
  };
  const onDeleteClose = () => {
    setShowDeleteModal(false);
  };
  return (
    <Modal
      variant={ModalVariant.small}
      titleIconVariant="warning"
      isOpen={isOpen}
      onClose={onDeleteClose}
      title={`Permanently delete ${blueprintName}?`}
      description={'All versions will be lost.'}
    >
      <ActionGroup>
        <Button variant="danger" type="button" onClick={handleDelete}>
          Delete
        </Button>
        <Button variant="link" type="button" onClick={onDeleteClose}>
          Cancel
        </Button>
      </ActionGroup>
    </Modal>
  );
};
